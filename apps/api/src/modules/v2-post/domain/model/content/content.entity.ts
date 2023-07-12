import { PostLang } from '../../../data-type/post-lang.enum';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { PostStatus } from '../../../data-type/post-status.enum';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { PostSettingAttributes } from './attributes/post-setting.entity';
import { PostPrivacy, PostType } from '../../../data-type';
import { GroupDto } from '../../../../v2-group/application';
import { GroupPrivacy } from '../../../../v2-group/data-type';
import { PostSettingDto } from '../../../application/dto';

export type ContentProps = {
  id: string;
  isReported: boolean;
  isHidden: boolean;
  createdBy: string;
  updatedBy: string;
  privacy: PostPrivacy;
  status: PostStatus;
  type: PostType;
  setting: PostSettingAttributes;
  media?: {
    files: FileEntity[];
    images: ImageEntity[];
    videos: VideoEntity[];
  };
  createdAt: Date;
  updatedAt: Date;
  markedReadImportant?: boolean;
  isSaved?: boolean;
  ownerReactions?: { id: string; reactionName: string }[];
  errorLog?: any;
  publishedAt?: Date;
  lang?: PostLang;
  groupIds?: string[];
  communityIds?: string[];
  wordCount?: number;
  aggregation?: {
    commentsCount: number;
    totalUsersSeen: number;
  };
};
export type ContentState = {
  attachGroupIds?: string[];
  detachGroupIds?: string[];
  attachSeriesIds?: string[];
  detachSeriesIds?: string[];
  attachCategoryIds?: string[];
  detachCategoryIds?: string[];
  attachTagIds?: string[];
  detachTagIds?: string[];
  attachFileIds?: string[];
  detachFileIds?: string[];
  attachImageIds?: string[];
  detachImageIds?: string[];
  attachVideoIds?: string[];
  detachVideoIds?: string[];
  enableSetting?: boolean;
  isChangeStatus?: boolean;
};
export class ContentEntity<
  Props extends ContentProps = ContentProps
> extends DomainAggregateRoot<Props> {
  protected _state: ContentState;
  public constructor(props: Props) {
    super(props);
    this.initState();
  }

  public initState(): void {
    this._state = {
      attachGroupIds: [],
      detachGroupIds: [],
      attachSeriesIds: [],
      detachSeriesIds: [],
      attachCategoryIds: [],
      detachCategoryIds: [],
      attachTagIds: [],
      detachTagIds: [],
      attachFileIds: [],
      detachFileIds: [],
      attachImageIds: [],
      detachImageIds: [],
      attachVideoIds: [],
      detachVideoIds: [],
      enableSetting: false,
      isChangeStatus: false,
    };
  }

  public getState(): ContentState {
    return this._state;
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID is not UUID`);
    }
    if (this._props.createdBy && !isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By is not UUID`);
    }
    if (this._props.updatedBy && !isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By is not UUID`);
    }
  }

  public setPrivacyFromGroups(groups: GroupDto[]): void {
    if (groups.length === 0) {
      return;
    }
    let totalPrivate = 0;
    let totalClosed = 0;
    for (const group of groups) {
      if (group.privacy === GroupPrivacy.OPEN) {
        this._props.privacy = PostPrivacy.OPEN;
        return;
      }
      if (group.privacy === GroupPrivacy.CLOSED) totalClosed++;
      if (group.privacy === GroupPrivacy.PRIVATE) totalPrivate++;
    }

    if (totalClosed > 0) this._props.privacy = PostPrivacy.CLOSED;
    if (totalPrivate > 0) this._props.privacy = PostPrivacy.PRIVATE;

    if (totalClosed === 0 && totalPrivate === 0) this._props.privacy = PostPrivacy.SECRET;
  }

  public getId(): string {
    return this._props.id;
  }

  public getCreatedBy(): string {
    return this._props.createdBy;
  }

  public isNotUsersSeen(): boolean {
    return this._props.aggregation.totalUsersSeen === 0;
  }

  public getType(): PostType {
    return this._props.type;
  }

  public getGroupIds(): string[] {
    return this._props.groupIds;
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isImportant(): boolean {
    return this._props.setting.isImportant;
  }

  public isPublished(): boolean {
    return this._props.status === PostStatus.PUBLISHED;
  }

  public isWaitingSchedule(): boolean {
    return this._props.status === PostStatus.WAITING_SCHEDULE;
  }

  public isProcessing(): boolean {
    return this._props.status === PostStatus.PROCESSING;
  }

  public isHidden(): boolean {
    return this._props.isHidden;
  }

  public isOpen(): boolean {
    return this._props.privacy === PostPrivacy.OPEN;
  }

  public isClosed(): boolean {
    return this._props.privacy === PostPrivacy.CLOSED;
  }

  /**
   * Note: Need to override createdAt when publishing
   */
  public setPublish(): void {
    if (!this.isPublished()) {
      this._state.isChangeStatus = true;
      this._props.createdAt = new Date();
    }
    this._props.status = PostStatus.PUBLISHED;
  }

  public isDraft(): boolean {
    return this._props.status === PostStatus.DRAFT;
  }

  public setProcessing(): void {
    this._props.status = PostStatus.PROCESSING;
  }

  public increaseTotalSeen(): void {
    this._props.aggregation.totalUsersSeen += 1;
  }

  public setMarkReadImportant(): void {
    this._props.markedReadImportant = true;
  }

  public setDraft(): void {
    this._props.status = PostStatus.DRAFT;
  }

  public setGroups(groupIds: string[]): void {
    this._state.attachGroupIds = groupIds.filter(
      (groupId) => !this._props.groupIds?.includes(groupId)
    );
    this._state.detachGroupIds = this._props.groupIds?.filter(
      (groupId) => !groupIds.includes(groupId)
    );

    this._props.groupIds = groupIds;
  }

  public setCommunity(communityIds: string[]): void {
    this._props.communityIds = communityIds;
  }

  public setSetting(setting: PostSettingDto): void {
    let isEnableSetting = false;
    if (
      setting &&
      (setting.isImportant || setting.canComment === false || setting.canReact === false)
    ) {
      isEnableSetting = true;
    }
    this._state.enableSetting = isEnableSetting;
    this._props.setting = {
      canComment: setting.canComment,
      canReact: setting.canReact,
      importantExpiredAt: setting.importantExpiredAt || null,
      isImportant: setting.isImportant,
    };
  }

  public update(data: { authUser: { id: string }; groupIds?: string[] }): void {
    const { authUser, groupIds } = data;
    if (groupIds) this.setGroups(groupIds);
    this._props.updatedAt = new Date();
    this._props.updatedBy = authUser.id;
  }

  public allowComment(): boolean {
    return this._props.setting.canComment;
  }

  public allowReact(): boolean {
    return this._props.setting.canReact;
  }

  public isEnableSetting(): boolean {
    const setting = this._props.setting;
    return (
      setting && (setting.isImportant || setting.canComment === false || setting.canReact === false)
    );
  }

  public isInArchivedGroups(): boolean {
    return this.isPublished() && !this.getGroupIds()?.length;
  }
}
