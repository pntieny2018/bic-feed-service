import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDateString } from 'class-validator';
import { MediaService } from '../../../media';
import { MediaFilterResponseDto } from '../../../media/dto/response';

export class CommentEditedHistoryDto {
  @ApiProperty({
    description: 'Comment ID',
    type: Number,
    name: 'comment_id'
  })
  @Expose()
  public commentId: number;

  @ApiProperty({
    description: 'Comment content',
    type: String,
  })
  @Expose()
  public content: string;

  @ApiProperty({
    description: 'Media',
    type: MediaFilterResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (
      typeof value === 'object' &&
      value.hasOwnProperty('files') &&
      value.hasOwnProperty('images') &&
      value.hasOwnProperty('videos')
    ) {
      return value;
    }
    if (value && value.length) {
      return MediaService.filterMediaType(value);
    }
    return new MediaFilterResponseDto([], [], []);
  })
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    description: 'Edited at',
    type: String,
    default: '2022-04-17T02:35:30.947+07',
    name: 'edited_at'
  })
  @IsDateString()
  @Expose()
  public editedAt: string;
}
