import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

import { PostEntity, PostAttributes } from '../model/content';

import { IPostFactory } from './interface';

export class PostFactory implements IPostFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createPost({ groupIds, userId }: { groupIds: string[]; userId: string }): PostEntity {
    const now = new Date();
    const entity = new PostEntity({
      id: v4(),
      groupIds,
      content: null,
      createdBy: userId,
      updatedBy: userId,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 0,
      },
      type: CONTENT_TYPE.POST,
      status: CONTENT_STATUS.DRAFT,
      media: {
        files: [],
        images: [],
        videos: [],
      },
      isHidden: false,
      isReported: false,
      privacy: null,
      setting: {
        canComment: true,
        canReact: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      createdAt: now,
      updatedAt: now,
      mentionUserIds: [],
      linkPreview: null,
      seriesIds: [],
      tags: [],
      wordCount: 0,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: PostAttributes): PostEntity {
    return this._eventPublisher.mergeObjectContext(new PostEntity(properties));
  }
}
