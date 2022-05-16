import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UploadType } from '../../../upload/dto/requests/upload.dto';

export class CreateMediaDto {
  @ApiProperty({
    description: 'uploadId get from upload service',
    type: String,
    example: '7663faa6-d008-404f-8e43-ce888b2b9aa8',
  })
  @IsNotEmpty()
  public uploadId: string;

  @ApiProperty({
    description: 'Content of post',
    enum: UploadType,
  })
  @IsNotEmpty()
  @IsEnum(UploadType)
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
  })
  @IsOptional()
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
