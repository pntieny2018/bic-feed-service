import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE, PRIVACY } from '@beincom/constants';
import { PostGroupAttributes } from '@libs/database/postgres/model';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';
import { FileEntity, ImageEntity, VideoEntity } from '../media';
import { QuizEntity } from '../quiz';
import { QuizParticipantEntity } from '../quiz-participant';

export type PostSettingAttributes = {
  isImportant: boolean;
  importantExpiredAt?: Date;
  canReact: boolean;
  canComment: boolean;
};

export type ContentAttributes = {
  id: string;
  title: string;
  isReported: boolean;
  isHidden: boolean;
  createdBy: string;
  updatedBy: string;
  privacy: PRIVACY;
  status: CONTENT_STATUS;
  type: CONTENT_TYPE;
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
  isSeen?: boolean;
  ownerReactions?: { id: string; reactionName: string }[];
  errorLog?: any;
  publishedAt?: Date;
  scheduledAt?: Date;
  lang?: LANGUAGE;
  groupIds?: string[];
  postGroups?: PostGroupAttributes[];
  communityIds?: string[];
  quiz?: QuizEntity;
  quizResults?: QuizParticipantEntity[];
  wordCount?: number;
  aggregation?: {
    commentsCount: number;
    totalUsersSeen: number;
    reactionsCount?: Record<string, number>;
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
  Props extends ContentAttributes = ContentAttributes
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

  public getPrivacy(): PRIVACY {
    return this._props.privacy;
  }

  public setPrivacyFromGroups(groups: GroupDto[]): void {
    if (groups.length === 0) {
      return;
    }
    let totalPrivate = 0;
    let totalClosed = 0;
    for (const group of groups) {
      if (group.privacy === PRIVACY.OPEN) {
        this._props.privacy = PRIVACY.OPEN;
        return;
      }
      if (group.privacy === PRIVACY.CLOSED) {
        totalClosed++;
      }
      if (group.privacy === PRIVACY.PRIVATE) {
        totalPrivate++;
      }
    }

    if (totalClosed > 0) {
      this._props.privacy = PRIVACY.CLOSED;
    }
    if (totalPrivate > 0) {
      this._props.privacy = PRIVACY.PRIVATE;
    }

    if (totalClosed === 0 && totalPrivate === 0) {
      this._props.privacy = PRIVACY.SECRET;
    }
  }

  public setWaitingSchedule(scheduledAt: Date): void {
    if (this.isPublished()) {
      return;
    }
    this._state.isChangeStatus = true;
    this._props.scheduledAt = scheduledAt;
    this._props.status = CONTENT_STATUS.WAITING_SCHEDULE;
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

  public getType(): CONTENT_TYPE {
    return this._props.type;
  }

  public getIsSeen(): boolean {
    return this._props.isSeen;
  }

  public getGroupIds(): string[] {
    return this._props.groupIds || [];
  }

  public getPostGroups(): PostGroupAttributes[] {
    return this._props.postGroups || [];
  }

  public hasQuiz(): boolean {
    return Boolean(this._props.quiz);
  }

  public getQuiz(): QuizEntity {
    return this._props.quiz;
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isImportant(): boolean {
    return this._props.setting.isImportant;
  }

  public isPublished(): boolean {
    return this._props.status === CONTENT_STATUS.PUBLISHED;
  }

  public isWaitingSchedule(): boolean {
    return this._props.status === CONTENT_STATUS.WAITING_SCHEDULE;
  }

  public isScheduleFailed(): boolean {
    return this._props.status === CONTENT_STATUS.SCHEDULE_FAILED;
  }

  public isProcessing(): boolean {
    return this._props.status === CONTENT_STATUS.PROCESSING;
  }

  public isVisible(): boolean {
    return !this._props.isHidden && this.isPublished() && this._props.groupIds?.length > 0;
  }

  public isHidden(): boolean {
    return this._props.isHidden;
  }

  public isOpen(): boolean {
    return this._props.privacy === PRIVACY.OPEN;
  }

  public isClosed(): boolean {
    return this._props.privacy === PRIVACY.CLOSED;
  }

  public isSaved(): boolean {
    return Boolean(this._props.isSaved);
  }

  public getLang(): LANGUAGE {
    return this._props.lang;
  }

  public setPublish(): void {
    if (!this.isPublished()) {
      this._state.isChangeStatus = true;
      this._props.publishedAt = new Date();
    }
    this._props.status = CONTENT_STATUS.PUBLISHED;
  }

  public isDraft(): boolean {
    return this._props.status === CONTENT_STATUS.DRAFT;
  }

  public setStatus(status: CONTENT_STATUS): void {
    this._props.status = status;
  }

  public setProcessing(): void {
    this._props.status = CONTENT_STATUS.PROCESSING;
  }

  public setScheduleFailed(): void {
    this._props.status = CONTENT_STATUS.SCHEDULE_FAILED;
  }

  public setErrorLog(errorLog: unknown): void {
    this._props.errorLog = errorLog;
  }

  public increaseTotalSeen(): void {
    this._props.aggregation.totalUsersSeen += 1;
  }

  public setMarkReadImportant(): void {
    this._props.markedReadImportant = true;
  }

  public setDraft(): void {
    this._props.status = CONTENT_STATUS.DRAFT;
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

  public setSetting(setting: PostSettingAttributes): void {
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
    if (groupIds) {
      this.setGroups(groupIds);
    }
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

  //TODO: Need to refactor this function so that the purpose use matches the naming
  public isInArchivedGroups(): boolean {
    return this.isPublished() && !this.getGroupIds()?.length;
  }

  public setReported(isReported: boolean): void {
    this._props.isReported = isReported;
  }

  public hide(): void {
    this._props.isHidden = true;
  }

  public getTitle(): string {
    return this._props.title;
  }
}
