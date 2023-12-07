import { CursorPaginationResult } from '@libs/database/postgres/common';
import { isEmpty } from 'lodash';
import { NIL, validate as isUUID, v4 } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { ReactionEntity } from '../reaction';

export type CommentAttributes = {
  id: string;
  postId: string;
  parentId?: string;
  content?: string;
  media?: {
    videos?: VideoEntity[];
    files?: FileEntity[];
    images?: ImageEntity[];
  };
  mentions?: string[];
  giphyId?: string;
  isHidden?: boolean;
  edited?: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  totalReply?: number;
  childs?: CursorPaginationResult<CommentEntity>;
  ownerReactions?: ReactionEntity[];
};

export class CommentEntity extends DomainAggregateRoot<CommentAttributes> {
  public constructor(props: CommentAttributes) {
    super(props);
  }

  public static create(props: Partial<CommentAttributes>, userId: string): CommentEntity {
    const { parentId, postId, content, giphyId, mentions } = props;
    const now = new Date();
    return new CommentEntity({
      id: v4(),
      parentId,
      postId,
      content,
      createdBy: userId,
      updatedBy: userId,
      media: {
        files: [],
        images: [],
        videos: [],
      },
      mentions: mentions,
      isHidden: false,
      edited: false,
      createdAt: now,
      updatedAt: now,
      giphyId,
    });
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Comment ID is not UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By is not UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By is not UUID`);
    }
  }

  public updateAttribute(data: Partial<CommentAttributes>, userId: string): void {
    const { content, mentions, giphyId } = data;
    this._props.updatedAt = new Date();
    this._props.edited = true;
    this._props.updatedBy = userId;
    if (content !== undefined) {
      this._props.content = content;
    }
    if (giphyId !== undefined) {
      this._props.giphyId = giphyId;
    }
    if (mentions && Array.isArray(mentions)) {
      this._props.mentions = mentions;
    }
  }

  public setMedia(media: {
    files: FileEntity[];
    images: ImageEntity[];
    videos: VideoEntity[];
  }): void {
    const { files, images, videos } = media;
    this._props.media = {
      files,
      images,
      videos,
    };
  }

  public isOwner(actorId: string): boolean {
    return this._props.createdBy === actorId;
  }

  public isEmptyComment(): boolean {
    return (
      isEmpty(this._props.content) &&
      isEmpty(this._props.giphyId) &&
      isEmpty(this._props.media.images) &&
      isEmpty(this._props.mentions)
    );
  }

  public isChildComment(): boolean {
    return this._props.parentId !== NIL;
  }

  public setChilds(childs: CursorPaginationResult<CommentEntity>): void {
    this._props.childs = childs;
  }

  public hide(): void {
    this._props.isHidden = true;
  }
}
