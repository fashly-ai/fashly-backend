import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadUserImageDto {
  @ApiProperty({
    description: 'Image URL from GCS',
    example: 'https://storage.googleapis.com/fashly-demo/user-images/user123.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'GCS key/path for the image',
    example: 'user-images/user123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  gcsKey?: string;

  @ApiProperty({
    description: 'Description of the image',
    example: 'Full body front view',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Set as default image',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UserImageResponseDto {
  @ApiProperty({
    description: 'Image ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://storage.googleapis.com/fashly-demo/user-images/user123.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'GCS key',
    example: 'user-images/user123.jpg',
    required: false,
  })
  gcsKey?: string;

  @ApiProperty({
    description: 'Whether this is the default image',
    example: true,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Image description',
    example: 'Full body front view',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Upload date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class SetDefaultImageDto {
  @ApiProperty({
    description: 'Image ID to set as default',
    example: 'uuid-string',
  })
  @IsString()
  imageId: string;
}

