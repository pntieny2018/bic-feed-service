import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ImageMetadataDto } from '../image-metadata.dto';

export class ImageMetadataResponseDto extends ImageMetadataDto {
  @ApiProperty({
    required: false,
    description: 'Origin image name',
    example: 'example.png',
    name: 'origin_name'
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @Expose()
  public originName?: string;
}
