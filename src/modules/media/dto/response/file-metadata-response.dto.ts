import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FileMetadataDto } from '../file-metadata.dto';

export class FileMetadataResponseDto extends FileMetadataDto {
  @ApiProperty({
    required: false,
    description: 'Origin file name',
    example: 'example.txt',
    name: 'origin_name'
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @Expose()
  public originName?: string;
}
