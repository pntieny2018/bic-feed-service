import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { FileDto, ImageDto, VideoDto } from './media.dto';

export class PostContentDto {
  @ApiProperty({
    description: 'Post content',
    type: String,
    default: null,
    required: false,
  })
  @IsOptional()
  public content: string = null;

  @ApiProperty({
    description: 'The list of file',
    type: FileDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  public files: FileDto[] = [];

  @ApiProperty({
    description: 'The list of video',
    type: VideoDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoDto)
  public videos: VideoDto[] = [];

  @ApiProperty({
    description: 'The list of image',
    type: ImageDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  public images: ImageDto[] = [];
}
