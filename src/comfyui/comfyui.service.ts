import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import WebSocket from 'ws';
import fetch from 'node-fetch';

export interface ComfyWorkflowOverrides {
  [key: string]: any;
}

export interface ComfyWorkflowResult {
  promptId: string;
  filename: string;
  buffer: Buffer;
}

@Injectable()
export class ComfyUIService {
  private readonly logger = new Logger(ComfyUIService.name);
  private readonly comfyUrl: string;

  constructor(private configService: ConfigService) {
    this.comfyUrl =
      this.configService.get<string>('COMFY_URL') || 'http://localhost:8000';
    this.logger.log(`ComfyUI URL configured: ${this.comfyUrl}`);
  }

  /**
   * Run a ComfyUI workflow with optional overrides
   */
  async runWorkflow(
    workflowPath: string,
    overrides: ComfyWorkflowOverrides = {},
  ): Promise<ComfyWorkflowResult> {
    try {
      // 1) Load the saved API workflow
      const workflowFullPath = path.resolve(workflowPath);
      if (!fs.existsSync(workflowFullPath)) {
        throw new Error(`Workflow file not found: ${workflowFullPath}`);
      }

      let base = JSON.parse(fs.readFileSync(workflowFullPath, 'utf-8'));
      this.logger.log(`Loaded workflow from: ${workflowFullPath}`);

      // Convert UI format to API format if needed
      if (base.nodes && Array.isArray(base.nodes)) {
        this.logger.log('Converting workflow from UI format to API format...');
        base = this.convertUIFormatToAPIFormat(base);
      }

      // 2) Apply overrides (e.g. text prompt, seed, image)
      for (const [nodePath, value] of Object.entries(overrides)) {
        // path like "8.inputs.text" -> set deep value
        const parts = nodePath.split('.');
        if (parts.length >= 3) {
          const [nodeId, , key] = parts;
          if (base[nodeId] && base[nodeId].inputs) {
            base[nodeId].inputs[key] = value;
            this.logger.debug(
              `Override applied: ${nodeId}.inputs.${key} = ${typeof value === 'string' ? value.substring(0, 50) : value}`,
            );
          }
        }
      }

      // 3) Generate client ID for WebSocket correlation
      const clientId = `nestjs-${Date.now()}`;

      // 4) Subscribe to progress via WebSocket
      const ws = new WebSocket(
        this.comfyUrl.replace('http', 'ws') + `/ws?clientId=${clientId}`,
      );

      ws.on('open', () => {
        this.logger.debug('WebSocket connection established');
      });

      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'progress') {
            this.logger.debug(
              `Progress: ${data.data.value}/${data.data.max} (${Math.round((data.data.value / data.data.max) * 100)}%)`,
            );
          } else if (data.type === 'executing') {
            this.logger.debug(`Executing node: ${data.data.node}`);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      ws.on('error', (error) => {
        this.logger.warn(`WebSocket error: ${error.message}`);
      });

      // 5) Submit prompt
      this.logger.log('Submitting workflow to ComfyUI...');
      const res = await fetch(`${this.comfyUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, prompt: base }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `ComfyUI /prompt failed: ${res.status} ${errorText}`,
        );
      }

      const { prompt_id } = (await res.json()) as { prompt_id: string };
      this.logger.log(`Workflow submitted with prompt_id: ${prompt_id}`);

      // 6) Poll history for completion
      let files: string[] = [];
      const maxAttempts = 120; // up to ~120s
      const pollInterval = 1000; // 1 second

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, pollInterval));

        const hres = await fetch(`${this.comfyUrl}/history/${prompt_id}`);
        if (!hres.ok) continue;

        const hist = (await hres.json()) as any;
        const item = hist?.[prompt_id];

        if (item?.outputs) {
          // Collect all output file names
          for (const node of Object.values<any>(item.outputs)) {
            if (node.images) {
              for (const img of node.images) {
                files.push(img.filename);
              }
            }
          }
          if (files.length) {
            this.logger.log(
              `Workflow completed! Found ${files.length} output file(s)`,
            );
            break;
          }
        }

        // Log progress every 10 seconds
        if (i % 10 === 0 && i > 0) {
          this.logger.debug(`Still waiting for completion... (${i}s elapsed)`);
        }
      }

      ws.close();

      if (!files.length) {
        throw new Error(
          'No outputs found in history after waiting 120 seconds',
        );
      }

      // 7) Download first image
      const fname = encodeURIComponent(files[0]);
      this.logger.log(`Downloading output image: ${files[0]}`);
      const imgRes = await fetch(
        `${this.comfyUrl}/view?filename=${fname}&type=output`,
      );

      if (!imgRes.ok) {
        throw new Error(`Failed to download image: ${imgRes.status}`);
      }

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      this.logger.log(
        `Successfully downloaded image (${(buffer.length / 1024).toFixed(2)} KB)`,
      );

      return {
        promptId: prompt_id,
        filename: files[0],
        buffer,
      };
    } catch (error) {
      this.logger.error('Error running ComfyUI workflow:', error);
      throw error;
    }
  }

  /**
   * Run the image2image workflow
   */
  async runImage2ImageWorkflow(
    inputImageBase64: string,
    prompt?: string,
    negativePrompt?: string,
    seed?: number,
  ): Promise<ComfyWorkflowResult> {
    try {
      // 1. Upload the input image to ComfyUI
      const imageName = await this.uploadImageToComfyUI(inputImageBase64);
      this.logger.log(`Uploaded input image: ${imageName}`);

      // 2. Load workflow
      const workflowPath = path.join(process.cwd(), 'image2image.json');
      const overrides: ComfyWorkflowOverrides = {};

      // 3. Set the input image in LoadImage node (node 10)
      overrides['10.inputs.image'] = imageName;

      // 4. Apply prompt override if provided (node 6 - positive prompt)
      if (prompt) {
        overrides['6.inputs.text'] = prompt;
      }

      // 5. Apply negative prompt override if provided (node 7 - negative prompt)
      if (negativePrompt) {
        overrides['7.inputs.text'] = negativePrompt;
      }

      // 6. Apply seed override if provided (node 3 - KSampler)
      if (seed !== undefined) {
        overrides['3.inputs.seed'] = seed;
      }

      // 7. Run the workflow
      return this.runWorkflow(workflowPath, overrides);
    } catch (error) {
      this.logger.error('Error in runImage2ImageWorkflow:', error);
      throw error;
    }
  }

  /**
   * Upload image to ComfyUI input directory
   */
  private async uploadImageToComfyUI(imageBase64: string): Promise<string> {
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const imageName = `input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

      // Create form data for upload
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: imageName,
        contentType: 'image/png',
      });
      formData.append('overwrite', 'true');

      // Upload to ComfyUI
      const response = await fetch(`${this.comfyUrl}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload image to ComfyUI: ${response.status} ${errorText}`);
      }

      const result = await response.json() as any;
      this.logger.log(`Image uploaded successfully: ${result.name || imageName}`);
      
      return result.name || imageName;
    } catch (error) {
      this.logger.error('Error uploading image to ComfyUI:', error);
      throw error;
    }
  }

  /**
   * Check if ComfyUI is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.comfyUrl}/`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      return res.ok;
    } catch (error) {
      this.logger.warn(`ComfyUI health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get ComfyUI system stats
   */
  async getSystemStats(): Promise<any> {
    try {
      const res = await fetch(`${this.comfyUrl}/system_stats`);
      if (!res.ok) {
        throw new Error(`Failed to get system stats: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      this.logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  /**
   * Get queue status
   */
  async getQueue(): Promise<any> {
    try {
      const res = await fetch(`${this.comfyUrl}/queue`);
      if (!res.ok) {
        throw new Error(`Failed to get queue: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      this.logger.error('Error getting queue:', error);
      throw error;
    }
  }

  /**
   * Convert ComfyUI UI format to API format
   * UI format has "nodes" array, API format is flat object with node IDs as keys
   */
  private convertUIFormatToAPIFormat(uiWorkflow: any): any {
    const apiWorkflow: any = {};

    if (!uiWorkflow.nodes || !Array.isArray(uiWorkflow.nodes)) {
      return uiWorkflow; // Already in API format or invalid
    }

    // List of node types that should be excluded (documentation/UI only nodes)
    const excludedNodeTypes = ['MarkdownNote', 'Note', 'Reroute'];

    for (const node of uiWorkflow.nodes) {
      // Skip excluded node types
      if (excludedNodeTypes.includes(node.type)) {
        this.logger.debug(`Skipping non-executable node: ${node.type} (ID: ${node.id})`);
        continue;
      }

      const nodeId = node.id.toString();
      
      // Build the API format node
      apiWorkflow[nodeId] = {
        inputs: {},
        class_type: node.type,
      };

      // Add widget values as inputs
      if (node.widgets_values && Array.isArray(node.widgets_values)) {
        // Get all widget inputs (inputs with widget property)
        const widgetInputs = node.inputs?.filter((input: any) => input.widget) || [];
        
        // Map widget values to input names in order
        for (let i = 0; i < Math.min(widgetInputs.length, node.widgets_values.length); i++) {
          const inputName = widgetInputs[i].name;
          let value = node.widgets_values[i];
          
          // Fix common issues with widget values
          if (inputName === 'steps' && value === 'randomize') {
            value = 20; // Default steps
          } else if (inputName === 'scheduler' && value === 'dpmpp_2m') {
            value = 'normal'; // Use a valid scheduler
          } else if (inputName === 'denoise' && typeof value === 'string') {
            value = 0.87; // Default denoise value
          } else if (inputName === 'sampler_name' && typeof value === 'number') {
            value = 'euler'; // Default sampler
          }
          
          apiWorkflow[nodeId].inputs[inputName] = value;
        }
      }

      // Add connected inputs
      if (node.inputs && Array.isArray(node.inputs)) {
        for (const input of node.inputs) {
          if (input.link !== null && input.link !== undefined) {
            // Find the source node and output
            const sourceLink = this.findLinkSource(uiWorkflow, input.link);
            if (sourceLink) {
              apiWorkflow[nodeId].inputs[input.name] = [
                sourceLink.nodeId.toString(),
                sourceLink.outputIndex,
              ];
            }
          }
        }
      }
    }

    this.logger.debug(`Converted ${uiWorkflow.nodes.length} nodes to API format`);
    return apiWorkflow;
  }

  /**
   * Find the source node and output index for a link
   */
  private findLinkSource(uiWorkflow: any, linkId: number): { nodeId: number; outputIndex: number } | null {
    for (const node of uiWorkflow.nodes) {
      if (node.outputs && Array.isArray(node.outputs)) {
        for (let outputIndex = 0; outputIndex < node.outputs.length; outputIndex++) {
          const output = node.outputs[outputIndex];
          if (output.links && Array.isArray(output.links) && output.links.includes(linkId)) {
            return { nodeId: node.id, outputIndex };
          }
        }
      }
    }
    return null;
  }
}

