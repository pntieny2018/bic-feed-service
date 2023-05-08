import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileMetadataDto } from './file-metadata.dto';
import { ImageMetadataDto } from './image-metadata.dto';
import { VideoMetadataDto } from './video-metadata.dto';
import { Expose, Transform, Type } from 'class-transformer';

export class MediaDto {
  @ApiProperty({ required: false, type: [ImageMetadataDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImageMetadataDto)
  @Expose()
  @Transform(({ value }) => value ?? [])
  public images?: ImageMetadataDto[] = [];

  @ApiProperty({ required: false, type: [VideoMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoMetadataDto)
  @IsOptional()
  @Expose()
  @Transform(({ value }) => value ?? [])
  public videos?: VideoMetadataDto[] = [];

  @ApiProperty({ required: false, type: [FileMetadataDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadataDto)
  @Expose()
  @Transform(({ value }) => value ?? [])
  public files?: FileMetadataDto[] = [];
}
