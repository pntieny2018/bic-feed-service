import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { SearchService } from './search.service';
import {
  PostChangedMessagePayload,
  SeriesChangedMessagePayload,
  ArticleChangedMessagePayload,
} from '../v2-post/application/dto/message';

@Controller()
export class SearchConsumer {
  public constructor(private readonly _postSearchService: SearchService) {}

  @EventPattern(KAFKA_TOPIC.CONTENT.POST_CHANGED)
  public async postChanged(@Payload('value') payload: PostChangedMessagePayload): Promise<void> {
    const { before, after, state } = payload;
    const {
      id,
      type,
      content,
      media,
      mentionUserIds,
      groupIds,
      communityIds,
      seriesIds,
      tags,
      actor,
      createdAt,
      updatedAt,
      lang,
      isHidden,
    } = after;

    if (state === 'publish') {
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
          seriesIds,
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
        seriesIds,
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
    const { before, after, state } = payload;
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
    } = after || {};

    switch (state) {
      case 'publish':
        await this._postSearchService.addPostsToSearch([
          {
            id,
            createdAt,
            updatedAt,
            createdBy: actor.id,
            title,
            summary,
            groupIds,
            isHidden,
            communityIds,
            type,
            items: [],
            coverMedia,
          },
        ]);
        break;
      case 'update':
        await this._postSearchService.updatePostsToSearch([
          {
            id,
            groupIds,
            communityIds,
            createdAt,
            updatedAt,
            createdBy: actor.id,
            isHidden,
            lang,
            summary,
            title,
            type,
            coverMedia,
          },
        ]);
        break;
      case 'delete':
        await this._postSearchService.deletePostsToSearch([{ id: before.id }]);
        break;
      default:
        break;
    }
  }

  @EventPattern(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED)
  public async articleChanged(
    @Payload('value') payload: ArticleChangedMessagePayload
  ): Promise<void> {
    const { before, after, state } = payload;
    const {
      id,
      type,
      content,
      title,
      summary,
      lang,
      groupIds,
      communityIds,
      seriesIds,
      actor,
      createdAt,
      updatedAt,
      isHidden,
      coverMedia,
      tags,
      categories,
    } = after || {};

    switch (state) {
      case 'publish':
        await this._postSearchService.addPostsToSearch([
          {
            id,
            type,
            content,
            isHidden,
            groupIds,
            communityIds,
            seriesIds,
            createdBy: actor.id,
            updatedAt,
            createdAt,
            title,
            summary,
            coverMedia,
            categories,
            tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
          },
        ]);
        break;
      case 'update':
        await this._postSearchService.updatePostsToSearch([
          {
            id,
            type,
            content,
            isHidden,
            groupIds,
            communityIds,
            seriesIds,
            createdBy: actor.id,
            lang,
            updatedAt,
            createdAt,
            title,
            summary,
            coverMedia,
            categories,
            tags: tags.map((tag) => ({ id: tag.id, name: tag.name, groupId: tag.groupId })),
          },
        ]);
        break;
      case 'delete':
        await this._postSearchService.deletePostsToSearch([{ id: before.id }]);
        break;
      default:
        break;
    }
  }
}
