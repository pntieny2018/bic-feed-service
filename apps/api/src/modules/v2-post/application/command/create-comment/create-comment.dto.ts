import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { MediaFilterResponseDto } from '../../../driving-apdater/dto/shared/media/response/media-response.dto';
import { UserMentionDto } from 'apps/api/src/modules/mention/dto';

export class CreateCommentDto {
  @ApiProperty()
  @Expose()
  public id: string;

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
    name: 'giphy_id',
  })
  @Expose()
  public giphyId?: string;

  @ApiProperty({
    name: 'giphy_url',
  })
  @Expose()
  public giphyUrl?: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose()
  public createdAt?: Date;

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
    type: [UserMentionDto],
    name: 'mentions',
    example: {
      beincom: {
        id: '26799d29-189b-435d-b618-30fb70e9b09e',
        username: 'beincom',
        fullname: 'Beincom EVOL',
      },
    },
  })
  @Expose()
  public mentions?: UserMentionDto[];

  public constructor(data: Partial<CreateCommentDto>) {
    Object.assign(this, data);
  }
}
