import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { UserMentionDto } from '../../../mention/dto';
import { CommentResponseDto } from '../../driving-apdater/dto/response';

import { FileDto, ImageDto, VideoDto } from './media.dto';

export class CommentDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({
    name: 'edited',
    example: false,
  })
  public edited = false;

  @ApiProperty({
    name: 'parent_id',
  })
  public parentId: string;

  @ApiProperty({
    name: 'post_id',
  })
  public postId: string;

  @ApiProperty({
    name: 'total_reply',
  })
  public totalReply = 0;

  @ApiProperty()
  public content?: string;

  @ApiProperty({
    name: 'giphy_id',
  })
  public giphyId?: string;

  @ApiProperty({
    name: 'giphy_url',
  })
  public giphyUrl?: string;

  @ApiProperty({
    name: 'created_at',
  })
  public createdAt?: Date;

  @ApiProperty({
    name: 'created_by',
  })
  public createdBy?: string;

  @ApiProperty({
    description: 'Array of files, images, videos',
  })
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
  public media?: {
    files: FileDto[];
    images: ImageDto[];
    videos: VideoDto[];
  };

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
  public mentions?: UserMentionDto;

  @ApiProperty()
  public actor: UserDto;

  public constructor(data: Partial<CommentDto>) {
    Object.assign(this, data);
  }
}

export class FindCommentsPaginationDto extends PaginatedResponse<CommentResponseDto> {
  public constructor(list: CommentResponseDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}

export class FindCommentsAroundIdDto extends PaginatedResponse<CommentResponseDto> {
  public constructor(list: CommentResponseDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
