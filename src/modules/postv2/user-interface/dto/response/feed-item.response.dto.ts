import { ApiProperty, PickType } from '@nestjs/swagger';
import { ArticleResponseDto } from '.';

export class ArticleInFeedResponseDto extends PickType(ArticleResponseDto, [
  'id',
  'title',
] as const) {}

export class FeedItemResponseDto extends PickType(ArticleResponseDto, [
  'id',
  'title',
  'content',
  'summary',
  'audience',
  'media',
  'coverMedia',
  'createdAt',
  'updatedAt',
  'actor',
  'setting',
  'isDraft',
  'isProcessing',
  'mentions',
  'commentsCount',
  'totalUsersSeen',
  'reactionsCount',
  'markedReadPost',
  'isSaved',
  'ownerReactions',
  'type',
  'linkPreview',
  'communities',
  'tags',
  'isReported',
] as const) {
  @ApiProperty({
    type: [ArticleInFeedResponseDto],
    name: 'articles',
  })
  public articles?: ArticleInFeedResponseDto[];

  public constructor(data: Partial<FeedItemResponseDto>) {
    super(data);
  }
}
