import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { CreatePostDraftProps } from './post.factory.interface';
import { PostEntity, PostProps } from '../../model/post';
import { PostStatus } from '../../../data-type/post-status.enum';
import { MediaEntity } from '../../model/media';
import { LinkPreviewEntity } from '../../model/link-preview';
import { TagEntity } from '../../model/tag';

export class PostFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createDraft(options: CreatePostDraftProps): PostEntity {
    const { groupIds, userId } = options;
    const now = new Date();
    const entity = new PostEntity({
      id: v4(),
      groupIds,
      createdBy: userId,
      updatedBy: userId,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 1,
      }
      status: PostStatus.DRAFT,
      media: [],
      mentionUserIds: [],
      linkPreview: null,
      series: [],
      tags: [],
      setting: {
        canComment: true,
        canReact: true,
        canShare: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: PostProps): PostEntity {
    return new PostEntity(properties);
  }
}
