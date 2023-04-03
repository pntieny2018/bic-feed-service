import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from '../../v2-user/application';

export class ReportReviewResponsesDto {
  @ApiProperty()
  @Expose()
  public id: string;

  @ApiProperty({
    name: 'article_title',
    required: false,
  })
  @Expose({
    name: 'article_title',
  })
  public articleTitle?: string;

  @ApiProperty({
    name: 'post_content',
    required: false,
  })
  @Expose({
    name: 'post_content',
  })
  public postContent?: string;

  @ApiProperty({
    name: 'comment_content',
    required: false,
  })
  @Expose({
    name: 'comment_content',
  })
  public commentContent?: string;

  @ApiProperty({
    name: 'comment_post_id',
    required: false,
  })
  @Expose({
    name: 'comment_post_id',
  })
  public commentPostId?: string;

  @ApiProperty({
    name: 'comment_parent_id',
    required: false,
  })
  @Expose({
    name: 'comment_parent_id',
  })
  public commentParentId?: string;

  @ApiProperty({
    name: 'target_id',
  })
  @Expose({
    name: 'target_id',
  })
  public targetId: string;

  @ApiProperty({
    name: 'target_type',
  })
  @Expose({
    name: 'target_type',
  })
  public targetType: string;

  @ApiProperty()
  @Expose()
  public author: UserDto;

  @ApiProperty({
    name: 'group_id',
  })
  @Expose({
    name: 'group_id',
  })
  public groupId: string;

  @ApiProperty({
    name: 'report_to',
  })
  @Expose({
    name: 'report_to',
  })
  public reportTo: string;

  @ApiProperty({
    name: 'reason_type',
  })
  @Expose({
    name: 'reason_type',
  })
  public reasonType: string;

  @ApiProperty()
  @Expose()
  public reason?: string;

  @ApiProperty()
  @Expose()
  public status: string;

  @ApiProperty({
    name: 'created_at',
  })
  @Expose({
    name: 'created_at',
  })
  public createdAt: Date;

  @ApiProperty({
    name: 'updated_at',
  })
  @Expose({
    name: 'updated_at',
  })
  public updatedAt?: Date;

  @Expose()
  public details: any;
}
