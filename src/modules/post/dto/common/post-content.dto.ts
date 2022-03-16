import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { FileDto, ImageDto, VideoDto } from './media.dto';

export class PostContentDto {
  @ApiProperty({
    description: 'Post content',
    type: String,
    default: 'Content...',
  })
  @IsNotEmpty()
  public content: string;

  @ApiProperty({
    description: 'The list of file',
    type: FileDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoDto)
  public files: FileDto[] = [];

  @ApiProperty({
    description: 'The list of video',
    type: VideoDto,
    isArray: true,
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
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  public images: ImageDto[] = [];
}
