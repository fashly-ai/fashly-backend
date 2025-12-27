import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FashnJobStatus } from '../database/entities/fashn-job.entity';

export interface JobUpdatePayload {
  jobId: string;
  userId: string;
  status: FashnJobStatus;
  progress: number;
  resultImageUrl?: string;
  upperResultUrl?: string;
  processingTime?: number;
  errorMessage?: string;
  historyId?: string;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

@WebSocketGateway({
  namespace: '/fashn-jobs',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class FashnJobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FashnJobsGateway.name);

  @WebSocketServer()
  server: Server;

  // Map of userId -> Set of socket IDs
  private userSockets: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from user sockets map
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  /**
   * Client subscribes to their job updates by sending their userId
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, userId: string): void {
    this.logger.log(`Client ${client.id} subscribed to user ${userId}`);
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    
    // Join a room for this user
    client.join(`user:${userId}`);
    
    // Acknowledge subscription
    client.emit('subscribed', { userId, message: 'Successfully subscribed to job updates' });
  }

  /**
   * Client unsubscribes from job updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, userId: string): void {
    this.logger.log(`Client ${client.id} unsubscribed from user ${userId}`);
    
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    
    client.leave(`user:${userId}`);
    client.emit('unsubscribed', { userId });
  }

  /**
   * Emit job status update to all connected clients for a user
   */
  emitJobUpdate(payload: JobUpdatePayload): void {
    this.logger.log(`Emitting job update for user ${payload.userId}, job ${payload.jobId}, status: ${payload.status}`);
    
    // Emit to user's room
    this.server.to(`user:${payload.userId}`).emit('job-update', payload);
    
    // Also emit specific events based on status
    if (payload.status === FashnJobStatus.COMPLETED) {
      this.server.to(`user:${payload.userId}`).emit('job-completed', payload);
    } else if (payload.status === FashnJobStatus.FAILED) {
      this.server.to(`user:${payload.userId}`).emit('job-failed', payload);
    } else if (payload.status === FashnJobStatus.PROCESSING_UPPER) {
      this.server.to(`user:${payload.userId}`).emit('job-processing', { 
        ...payload, 
        step: 'upper',
        message: 'Processing upper garment...' 
      });
    } else if (payload.status === FashnJobStatus.PROCESSING_LOWER) {
      this.server.to(`user:${payload.userId}`).emit('job-processing', { 
        ...payload, 
        step: 'lower',
        message: 'Processing lower garment...' 
      });
    }
  }

  /**
   * Emit job completed event
   */
  emitJobCompleted(payload: JobUpdatePayload): void {
    this.emitJobUpdate({ ...payload, status: FashnJobStatus.COMPLETED });
  }

  /**
   * Emit job failed event
   */
  emitJobFailed(payload: JobUpdatePayload): void {
    this.emitJobUpdate({ ...payload, status: FashnJobStatus.FAILED });
  }
}

