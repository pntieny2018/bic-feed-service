import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { MediaDto } from './media.dto';
import { ReactionCount, ReactionDto } from './reaction.dto';
import { ReportReasonCountDto } from './report.dto';
import { UserMentionDto } from './user-mention.dto';

export class CommentBaseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ name: 'post_id' })
  public postId: string;

  @ApiProperty({ name: 'parent_id' })
  public parentId: string;

  @ApiProperty()
  public content?: string;

  @ApiProperty({ description: 'Array of files, images, videos' })
  @Transform(({ value }) => value || { files: [], videos: [], images: [] })
  public media?: MediaDto;

  @ApiProperty({ type: [UserMentionDto] })
  public mentions?: UserMentionDto;

  @ApiProperty({ name: 'giphy_id' })
  public giphyId?: string;

  @ApiProperty({ name: 'giphy_url' })
  public giphyUrl?: string;

  @ApiProperty({ name: 'edited' })
  public edited = false;

  @ApiProperty({ name: 'created_by' })
  public createdBy?: string;

  @ApiProperty({ name: 'created_at' })
  public createdAt?: Date;

  @ApiProperty({ name: 'updated_at' })
  public updatedAt?: Date;

  @ApiProperty({ name: 'total_reply' })
  public totalReply = 0;

  @ApiProperty()
  public actor: UserDto;

  public constructor(data: Partial<CommentBaseDto>) {
    Object.assign(this, data);
  }
}

export class CommentExtendedDto extends CommentBaseDto {
  @ApiProperty({ name: 'child' })
  public child?: PaginatedResponse<CommentExtendedDto>;

  @ApiProperty({ type: [ReactionDto], name: 'owner_reactions' })
  public ownerReactions?: ReactionDto[] = [];

  @ApiProperty({ name: 'reactions_count' })
  public reactionsCount?: ReactionCount[] = [];

  @ApiProperty({ name: 'report_reasons_count' })
  public reportReasonsCount: ReportReasonCountDto[];

  public constructor(data: Partial<CommentExtendedDto>) {
    super(data);
    Object.assign(this, data);
  }
}

export class FindCommentsPaginationDto extends PaginatedResponse<CommentExtendedDto> {
  public constructor(list: CommentExtendedDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}

export class FindCommentsAroundIdDto extends PaginatedResponse<CommentExtendedDto> {
  public constructor(list: CommentExtendedDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
