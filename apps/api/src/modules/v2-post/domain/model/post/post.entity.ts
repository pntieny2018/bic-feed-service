import { PostLang } from '../../../data-type/post-lang.enum';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { PostStatus } from '../../../data-type/post-status.enum';
import { TagEntity } from '../tag';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { LinkPreviewEntity } from '../link-preview';
import { PostSettingAttributes } from './attributes/post-setting.entity';
import { PostPrivacy } from '../../../data-type';

export type PostProps = {
  id: string;
  media: {
    videos: VideoEntity[];
    files: FileEntity[];
    images: ImageEntity[];
  }[];
  aggregation: {
    commentsCount: number;
    totalUsersSeen: number;
  };
  isReported: boolean;
  isHidden: boolean;
  createdBy: string;
  updatedBy: string;
  privacy: PostPrivacy;
  status: PostStatus;
  setting: PostSettingAttributes;
  createdAt: Date;
  updatedAt: Date;
  errorLog?: any;
  publishedAt?: Date;
  content?: string;
  lang?: PostLang;
  groupIds?: string[];
  mentionUserIds?: string[];
  linkPreview?: LinkPreviewEntity;
  series?: any;
  tags?: TagEntity[];
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
