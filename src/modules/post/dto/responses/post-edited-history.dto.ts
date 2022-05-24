import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDateString, IsUUID } from 'class-validator';
import { MediaService } from '../../../media';
import { MediaFilterResponseDto } from '../../../media/dto/response';

export class PostEditedHistoryDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public postId: string;

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
  })
  @IsDateString()
  @Expose()
  public editedAt: string;
}
