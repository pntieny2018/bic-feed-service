import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString } from 'class-validator';
import { MediaFilterResponseDto } from '../../../media/dto/response';

export class PostEditedHistoryDto {
  @ApiProperty({
    description: 'Post ID',
    type: Number,
  })
  @Expose()
  public postId: number;

  @ApiProperty({
    description: 'Post content',
    type: String,
  })
  @Expose()
  public content: string;

  @ApiProperty({
    description: 'Media',
    type: MediaFilterResponseDto,
  })
  @Expose()
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    description: 'Edited at',
    type: String,
    default: '2022-04-17T02:35:30.947+07',
  })
  @IsDateString()
  @Expose()
  public editedAt: string;
}
