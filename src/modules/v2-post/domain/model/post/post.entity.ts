import { PostLang } from '../../../data-type/post-lang.enum';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { PostStatus } from '../../../data-type/post-status.enum';
import { TagEntity } from '../tag';

export type PostProps = {
  id: string;
  groupIds: string[];
  media: any;
  mentions: any;
  linkPreview: any;
  series: any;
  tags: TagEntity[];

  createdBy: string;
  updatedBy: string;
  content: string;
  lang: PostLang;
  status: PostStatus;
  commentsCount: number;
  totalUsersSeen: number;
  isImportant: boolean;
  importantExpiredAt: string;
  canReact: boolean;
  canShare: boolean;
  canComment: boolean;
  isReported: boolean;
  isHidden: boolean;
};

export class PostEntity extends DomainAggregateRoot<PostProps> {
  public constructor(props: PostProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID is not UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By is not UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By is not UUID`);
    }
  }
}
