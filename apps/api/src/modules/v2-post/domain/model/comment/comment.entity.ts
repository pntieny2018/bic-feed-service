import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { FileEntity, ImageEntity, VideoEntity } from '../media';

export type CommentProps = {
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
};

export class CommentEntity extends DomainAggregateRoot<CommentProps> {
  public constructor(props: CommentProps) {
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
}
