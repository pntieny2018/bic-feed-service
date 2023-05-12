import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../driving-apdater/dto/shared/media/response/media-response.dto';
import { UserMentionDto } from '../../../driving-apdater/dto/shared/mention/user-mention.dto';

export class CreateCommentDto {
  @ApiProperty()
  @Expose()
  public id: string;

  @ApiProperty()
  @Expose()
  public edited: boolean = false;

  @ApiProperty({
    name: 'parent_id',
  })
  @Expose()
  public parentId: string;

  @ApiProperty({
    name: 'post_id',
  })
  @Expose()
  public postId: string;

  @ApiProperty({
    name: 'total_reply',
  })
  @Expose()
  public totalReply: number = 0;

  @ApiProperty()
  @Expose()
  public content?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public giphyId?: string;

  @ApiProperty()
  @Expose()
  public giphyUrl?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  @Expose()
  public updatedAt?: Date;

  @ApiProperty({
    name: 'created_by',
  })
  @Expose()
  public createdBy?: string;

  @ApiProperty({
    description: 'Array of files, images, videos',
    type: MediaFilterResponseDto,
  })
  @Expose()
  @Transform(({ value }) => {
    if (!value) {
      return {
        files: [],
        videos: [],
        images: [],
      };
    }
    return value;
  })
  public media?: MediaFilterResponseDto;

  @ApiProperty({
    type: UserMentionDto,
    name: 'mentions',
  })
  @Expose()
  public mentions?: UserMentionDto;

  public constructor(data: Partial<CreateCommentDto>) {
    Object.assign(this, data);
  }
}
