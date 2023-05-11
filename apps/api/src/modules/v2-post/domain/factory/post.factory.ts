import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CreatePostDraftProps, IPostFactory } from './interface';
import { PostEntity, PostProps } from '../model/post';
import { PostStatus } from '../../data-type/post-status.enum';
import { PostPrivacy, PostType } from '../../data-type';

export class PostFactory implements IPostFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createDraft(options: CreatePostDraftProps): PostEntity {
    const { groupIds, userId } = options;
    const now = new Date();
    const entity = new PostEntity({
      id: v4(),
      groupIds,
      content: null,
      createdBy: userId,
      updatedBy: userId,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 1,
      },
      type: PostType.POST,
      status: PostStatus.DRAFT,
      media: [],
      isHidden: false,
      isReported: false,
      privacy: PostPrivacy.OPEN,
      setting: {
        canComment: true,
        canReact: true,
        canShare: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      createdAt: now,
      updatedAt: now,
      mentionUserIds: [],
      linkPreview: null,
      series: [],
      tags: [],
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: PostProps): PostEntity {
    return this._eventPublisher.mergeObjectContext(new PostEntity(properties));
  }
}
