import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { NIL, validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { isEmpty } from 'lodash';
import { ReactionEntity } from '../reaction';

export type CommentAttributes = {
  id: string;
  media?: {
    videos?: VideoEntity[];
    files?: FileEntity[];
    images?: ImageEntity[];
  };
  postId: string;
  parentId?: string;
  edited?: boolean;
  content?: string;
  giphyId?: string;
  isHidden?: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  totalReply?: number;
  childs?: CommentEntity[];
  mentions?: string[];
  ownerReactions?: ReactionEntity[];
};

export class CommentEntity extends DomainAggregateRoot<CommentAttributes> {
  public constructor(props: CommentAttributes) {
    super(props);
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
    if (content !== undefined) this._props.content = content;
    if (giphyId !== undefined) this._props.giphyId = giphyId;
    if (mentions && Array.isArray(mentions)) this._props.mentions = mentions;
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
}
