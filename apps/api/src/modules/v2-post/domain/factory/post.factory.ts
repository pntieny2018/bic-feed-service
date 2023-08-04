import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IPostFactory } from './interface';
import { PostEntity, PostAttributes } from '../model/content';
import { PostStatus, PostType } from '../../data-type';

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
      type: PostType.POST,
      status: PostStatus.DRAFT,
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
