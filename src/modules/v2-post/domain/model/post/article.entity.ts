import { PostLang } from '../../../data-type/post-lang.enum';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { PostStatus } from '../../../data-type/post-status.enum';
import { TagEntity } from '../tag';
import { LinkPreviewEntity } from '../link-preview';
import { MediaEntity } from '../media';
import camelcase from 'camelcase';

export type ArticleProps = {
  id: string;
  groupIds: string[];
  media: MediaEntity[];
  mentionUserIds: string[];
  linkPreview: LinkPreviewEntity;
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

export class ArticleEntity extends DomainAggregateRoot<ArticleProps> {
  public constructor(props: ArticleProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      camelcase(['asfsdf']);
      throw new DomainModelException(`Updated By must be UUID`);
    }
  }
}
