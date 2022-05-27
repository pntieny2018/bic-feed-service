import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UploadType } from '../../../upload/dto/requests/upload.dto';
import { Expose } from 'class-transformer';

export class CreateMediaDto {
  @ApiProperty({
    description: 'uploadId get from upload service',
    type: String,
    example: '7663faa6-d008-404f-8e43-ce888b2b9aa8',
    name: 'upload_id',
  })
  @IsNotEmpty()
  @Expose({
    name: 'upload_id',
  })
  public uploadId: string;

  @ApiProperty({
    description: 'Content of post',
    enum: UploadType,
    name: 'upload_type',
  })
  @IsNotEmpty()
  @IsEnum(UploadType)
  @Expose({
    name: 'upload_type',
  })
  public uploadType: UploadType;

  @ApiProperty({
    description: 'Url',
    type: String,
    example: 'http://google.com...',
  })
  @IsOptional()
  public url?: string;

  @ApiProperty({
    description: 'File name',
    type: String,
    example: 'Filename.mp4',
  })
  @IsOptional()
  public name: string;

  @ApiProperty({
    description: 'extension',
    type: String,
    example: 'jpg | png | mp4 | avi',
    required: false,
  })
  @IsOptional()
  public extension?: string;

  @ApiProperty({
    description: 'mimeType',
    type: String,
    required: false,
    name: 'mime_type',
  })
  @IsOptional()
  @Expose({
    name: 'mime_type',
  })
  public mimeType?: string;

  @ApiProperty({
    description: 'Size of file in kb',
    type: Number,
    example: '10000',
    required: false,
  })
  @IsOptional()
  public size?: number;
}
