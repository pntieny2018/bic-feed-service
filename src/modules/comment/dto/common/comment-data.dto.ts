import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { FileMetadataDto, ImageMetadataDto, VideoMetadataDto } from '../../../media/dto';

export class CommentDataDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  public content?: string = null;

  @ApiProperty({ required: false, type: [ImageMetadataDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImageMetadataDto)
  @Expose()
  public images?: ImageMetadataDto[] = [];

  @ApiProperty({ required: false, type: [VideoMetadataDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoMetadataDto)
  @IsOptional()
  @Expose()
  public videos?: VideoMetadataDto[] = [];

  @ApiProperty({ required: false, type: [FileMetadataDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadataDto)
  @IsOptional()
  @Expose()
  public files?: FileMetadataDto[] = [];
}
