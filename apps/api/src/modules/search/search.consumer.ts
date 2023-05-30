import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PostChangedMessagePayload } from '../v2-post/application/dto/message/post-published.message-payload';
import { KAFKA_TOPIC } from '../../common/constants';
import { SearchService } from './search.service';
import { PostStatus } from '../v2-post/data-type/post-status.enum';

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
}
