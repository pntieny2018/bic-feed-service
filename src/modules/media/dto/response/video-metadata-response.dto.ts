import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VideoMetadataDto } from '../video-metadata.dto';

export class VideoMetadataResponseDto extends VideoMetadataDto {
  @ApiProperty({
    required: false,
    description: 'Origin videp name',
    example: 'example.mp4',
    name: 'origin_name'
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  public originName?: string;
}
