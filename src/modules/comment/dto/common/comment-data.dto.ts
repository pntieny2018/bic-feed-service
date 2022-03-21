import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { FileMetadataDto, ImageMetadataDto, VideoMetadataDto } from '../../../media/dto';

export class CommentDataDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  public content?: string;

  @ApiProperty({ required: false, type: [ImageMetadataDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageMetadataDto)
  @Expose()
  public images?: ImageMetadataDto[];

  @ApiProperty({ required: false, type: [VideoMetadataDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoMetadataDto)
  @Expose()
  public videos?: VideoMetadataDto[];

  @ApiProperty({ required: false, type: [FileMetadataDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadataDto)
  @Expose()
  public files?: FileMetadataDto[];
}
