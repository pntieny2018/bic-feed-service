import { ApiProperty } from '@nestjs/swagger';
import { FileDto, ImageDto, VideoDto } from './media.dto';

export class PostContentDto {
  @ApiProperty({
    description: 'Post content',
    type: String,
  })
  content: string;

  @ApiProperty({
    description: 'The list of file',
    type: FileDto,
    isArray: true,
  })
  files: FileDto[];

  @ApiProperty({
    description: 'The list of video',
    type: FileDto,
    isArray: true,
  })
  videos: VideoDto[];

  @ApiProperty({
    description: 'The list of image',
    type: FileDto,
    isArray: true,
  })
  images: ImageDto[];
}
