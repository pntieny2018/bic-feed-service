import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PostChangedMessagePayload } from '../v2-post/application/dto/message/post-published.message-payload';
import { KAFKA_TOPIC } from '../../common/constants';
import { SearchService } from './search.service';
import { PostStatus } from '../v2-post/data-type/post-status.enum';
import { SeriesChangedMessagePayload } from '../v2-post/application/dto/message/series-changed.message-payload';
import { PostType } from '../../database/models/post.model';

@Controller()
export class SearchConsumer {
  public constructor(private readonly _postSearchService: SearchService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<void> {
    const { before, after, isPublished } = payload;
    const {
      id,
      type,
      content,
      media,
      mentionUserIds,
      groupIds,
      communityIds,
      tags,
      actor,
      createdAt,
      updatedAt,
      lang,
      isHidden,
    } = after;

    if (isPublished) {
      await this._postSearchService.addPostsToSearch([
        {
          id,
          type,
          content,
          media,
          isHidden,
          mentionUserIds,
          groupIds,
          communityIds,
          tags,
          createdBy: actor.id,
          createdAt,
          updatedAt,
        },
      ]);
      return;
    }
    await this._postSearchService.updatePostsToSearch([
      {
        id,
        type,
        content,
        media,
        isHidden,
        mentionUserIds,
        groupIds,
        communityIds,
        tags,
        createdBy: actor.id,
        createdAt,
        updatedAt,
        lang,
      },
    ]);
  }

  @EventPattern(KAFKA_TOPIC.CONTENT.SERIES_CHANGED)
  public async seriesChanged(
    @Payload('value') payload: SeriesChangedMessagePayload
  ): Promise<void> {
    const { before, after, isPublished } = payload;
    const {
      id,
      type,
      title,
      summary,
      groupIds,
      communityIds,
      actor,
      createdAt,
      updatedAt,
      lang,
      isHidden,
      coverMedia,
    } = after;

    if (isPublished) {
      await this._postSearchService.addPostsToSearch([
        {
          id,
          createdAt,
          updatedAt,
          createdBy: actor.id,
          title,
          summary,
          groupIds: groupIds,
          isHidden: false,
          communityIds,
          type: PostType.SERIES,
          items: [],
          coverMedia,
        },
      ]);
      return;
    }
    await this._postSearchService.updatePostsToSearch([
      {
        id,
        groupIds: groupIds,
        communityIds,
        createdAt,
        updatedAt,
        createdBy: actor.id,
        isHidden: false,
        lang,
        summary,
        title,
        type: PostType.SERIES,
        coverMedia,
      },
    ]);
  }
}
