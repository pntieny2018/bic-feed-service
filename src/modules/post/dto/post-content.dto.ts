import { ApiProperty } from '@nestjs/swagger';
import { FileDto, ImageDto, VideoDto } from './media.dto';

export class PostContentDto {
  @ApiProperty({
    description: 'Post content',
    type: String,
  })
  public content: string;

  @ApiProperty({
    description: 'The list of file',
    type: FileDto,
    isArray: true,
  })
  public files: FileDto[];

  @ApiProperty({
    description: 'The list of video',
    type: FileDto,
    isArray: true,
  })
  public videos: VideoDto[];

  @ApiProperty({
    description: 'The list of image',
    type: FileDto,
    isArray: true,
  })
  public images: ImageDto[];
}
