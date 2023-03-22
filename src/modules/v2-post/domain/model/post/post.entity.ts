import { PostLang } from '../../../data-type/post-lang.enum';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { PostStatus } from '../../../data-type/post-status.enum';
import { TagEntity } from '../tag';
import { MediaEntity } from '../media';
import { LinkPreviewEntity } from '../link-preview';
import { PostSettingAttributes } from './attributes/post-setting.entity';

export type PostProps = {
  id: string;
  groupIds: string[];
  media: MediaEntity[];
  mentionUserIds: string[];
  linkPreview: LinkPreviewEntity;
  series: any;
  tags: TagEntity[];
  aggregation: {
    commentsCount: number;
    totalUsersSeen: number;
  };
  createdBy: string;
  updatedBy: string;
  content: string;
  lang?: PostLang;
  status: PostStatus;
  setting: PostSettingAttributes;
  createdAt: Date;
  updatedAt: Date;
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
