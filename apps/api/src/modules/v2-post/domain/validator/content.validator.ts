import { CONTENT_TYPE, PERMISSION_KEY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';
import moment from 'moment';

import { AUTHORITY_APP_SERVICE_TOKEN, IAuthorityAppService } from '../../../authority';
import { RULES } from '../../constant';
import {
  ContentAccessDeniedException,
  ContentEmptyGroupException,
  ContentInvalidScheduledTimeException,
  ContentLimitAttachedSeriesException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentNoPinPermissionException,
  ContentNotFoundException,
  ContentRequireGroupException,
  TagSeriesInvalidException,
  UserNoBelongGroupException,
} from '../exception';
import { SeriesEntity, ContentEntity, PostEntity, ArticleEntity } from '../model/content';
import { TagEntity } from '../model/tag';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IPostGroupRepository,
  IReportRepository,
  POST_GROUP_REPOSITORY_TOKEN,
  REPORT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import {
  IUserAdapter,
  USER_ADAPTER,
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface';

import { IContentValidator } from './interface';

@Injectable()
export class ContentValidator implements IContentValidator {
  private readonly _logger = new Logger(ContentValidator.name);
  public constructor(
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepo: IContentRepository,
    @Inject(REPORT_REPOSITORY_TOKEN)
    protected readonly _reportRepo: IReportRepository,
    @Inject(POST_GROUP_REPOSITORY_TOKEN)
    protected readonly _postGroupRepo: IPostGroupRepository,

    @Inject(GROUP_ADAPTER)
    protected readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    protected readonly _userAdapter: IUserAdapter
  ) {}

  public async checkCanCRUDContent(input: {
    user: UserDto;
    groupIds: string[];
    contentType?: CONTENT_TYPE;
    groups?: GroupDto[];
  }): Promise<void> {
    const { user, groupIds, contentType } = input;
    let { groups } = input;

    if (groups?.length) {
      const needFindGroupIds = groupIds.filter(
        (groupId) => !groups.some((group) => group.id === groupId)
      );
      if (needFindGroupIds.length) {
        const needFindGGroups = await this._groupAdapter.getGroupsByIds(needFindGroupIds);
        groups.push(...needFindGGroups);
      }
    } else {
      groups = await this._groupAdapter.getGroupsByIds(groupIds);
    }

    await this._authorityAppService.buildAbility(user);
    const permissionKey = this._postTypeToPermissionKey(contentType);

    const notCreatableInGroups: GroupDto[] = groups.filter(
      (group) => !this._authorityAppService.canDoActionOnGroup(permissionKey, group.id)
    );

    if (notCreatableInGroups.length) {
      throw new ContentNoCRUDPermissionAtGroupException(
        notCreatableInGroups.map((e) => e.name),
        null,
        { groupsDenied: notCreatableInGroups.map((e) => e.id) }
      );
    }
  }

  public async checkCanEditContentSetting(
    user: UserDto,
    groupAudienceIds: string[]
  ): Promise<void> {
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAdapter.getGroupsByIds(groupAudienceIds);
    await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      if (
        !this._authorityAppService.canDoActionOnGroup(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          group.id
        )
      ) {
        notEditSettingInGroups.push(group);
      }
    }

    if (notEditSettingInGroups.length) {
      throw new ContentNoEditSettingPermissionAtGroupException(
        notEditSettingInGroups.map((e) => e.name),
        null,
        { groupsDenied: notEditSettingInGroups.map((e) => e.id) }
      );
    }
  }

  private _postTypeToPermissionKey(postType: CONTENT_TYPE): string {
    switch (postType) {
      case CONTENT_TYPE.SERIES:
        return PERMISSION_KEY.CRUD_SERIES;
      case CONTENT_TYPE.ARTICLE:
      case CONTENT_TYPE.POST:
      default:
        return PERMISSION_KEY.CRUD_POST_ARTICLE;
    }
  }

  public async validatePublishContent(
    contentEntity: ContentEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    if (!contentEntity.isOwner(userAuth.id)) {
      throw new ContentAccessDeniedException();
    }

    if (contentEntity.get('groupIds')?.length === 0) {
      throw new ContentEmptyGroupException();
    }

    const contentType = contentEntity.get('type');
    const state = contentEntity.getState();
    const { detachGroupIds, attachGroupIds } = state;
    const isEnableSetting = contentEntity.isEnableSetting();

    await this.checkCanCRUDContent({ user: userAuth, groupIds, contentType });

    if (detachGroupIds?.length) {
      await this.checkCanCRUDContent({ user: userAuth, groupIds: detachGroupIds, contentType });
    }

    if (
      isEnableSetting &&
      (state.isChangeStatus || attachGroupIds?.length || detachGroupIds?.length)
    ) {
      await this.checkCanEditContentSetting(userAuth, groupIds);
    }
  }

  public async validateMentionUsers(userIds: string[], groupIds: string[]): Promise<void> {
    if (!userIds?.length || !groupIds?.length) {
      return;
    }
    const users = await this._userAdapter.getUsersByIds(userIds, {
      withGroupJoined: true,
    });
    const invalidUsers = [];
    for (const user of users) {
      if (!groupIds.some((groupId) => user?.groups.includes(groupId))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException(null, { usersDenied: invalidUsers });
    }
  }

  public async checkCanReadContent(
    post: ContentEntity,
    user: UserDto,
    options?: {
      dataGroups?: GroupDto[];
    }
  ): Promise<void> {
    if (post.isOwner(user.id)) {
      return;
    }

    if (post.isDraft() || post.isHidden()) {
      throw new ContentNoCRUDPermissionException();
    }
    console.log('post.isOpen()=', post.isOpen());
    console.log('post.isClosed()=', post.isClosed());
    if (post.isOpen() || post.isClosed()) {
      console.log('1111');
      return;
    }

    const groupAudienceIds = post.get('groupIds') ?? [];
    const isAdmin = await this._groupAdapter.isAdminInAnyGroups(user.id, groupAudienceIds);
    if (isAdmin) {
      return;
    }

    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    console.log('canAccess=', canAccess);
    if (!canAccess) {
      if (options?.dataGroups?.length) {
        throw new ContentRequireGroupException(null, { requireGroups: options.dataGroups });
      }
      throw new ContentNoCRUDPermissionException();
    }
  }

  public async validateContentReported(contentId: string, userId: string): Promise<void> {
    const isReport = await this._reportRepo.checkIsReported(userId, contentId);
    if (isReport) {
      throw new ContentNotFoundException();
    }
  }

  public async validateContentArchived(user: UserDto, postGroupIds: string[]): Promise<void> {
    const userJoinedGroupIds = user.groups ?? [];
    const groupCanAccess = postGroupIds.filter((groupId) => userJoinedGroupIds.includes(groupId));
    const activePostGroupIds = await this._postGroupRepo.getNotInStateGroupIds(
      groupCanAccess,
      true
    );

    if (!activePostGroupIds.length) {
      throw new ContentNotFoundException();
    }
  }

  public async checkCanReadNotPublishedContent(
    contentEntity: ContentEntity,
    userId: string
  ): Promise<void> {
    if (contentEntity.isPublished()) {
      return;
    }

    const isOwner = contentEntity.isOwner(userId);
    if (isOwner) {
      return;
    }

    const isDraftContent = contentEntity.isDraft();
    const isHiddenContent = contentEntity.isHidden();
    if (isDraftContent || isHiddenContent) {
      throw new ContentAccessDeniedException();
    }

    const isScheduleContent = contentEntity.isScheduleFailed() || contentEntity.isWaitingSchedule();
    if (isScheduleContent) {
      const isAdmin = await this._groupAdapter.isAdminInAnyGroups(
        userId,
        contentEntity.getGroupIds()
      );
      if (!isAdmin) {
        throw new ContentAccessDeniedException();
      }
    }
  }

  public async validateSeriesAndTags(
    groups: GroupDto[] = [],
    seriesIds: string[],
    tags: TagEntity[]
  ): Promise<void> {
    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };
    if (seriesIds?.length) {
      const groupIds = groups.map((e) => e.id);
      const series = await this._contentRepo.findAll({
        attributes: {
          exclude: ['content'],
        },
        include: {
          mustIncludeGroup: true,
        },
        where: {
          ids: seriesIds,
          type: CONTENT_TYPE.SERIES,
          groupArchived: false,
        },
      });
      series.forEach((item: SeriesEntity) => {
        const isValid = item.get('groupIds').some((groupId) => groupIds.includes(groupId));
        if (!isValid) {
          seriesTagErrorData.seriesIds.push(item.get('id'));
          seriesTagErrorData.seriesNames.push(item.get('title'));
        }
      });
    }

    if (tags?.length) {
      const rootGroupIds = groups.map((e) => e.rootGroupId);
      const invalidTags = tags.filter((tag) => !rootGroupIds.includes(tag.get('groupId')));
      if (invalidTags) {
        invalidTags.forEach((e) => {
          seriesTagErrorData.tagIds.push(e.get('id'));
          seriesTagErrorData.tagNames.push(e.get('name'));
        });
      }
    }

    if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
      throw new TagSeriesInvalidException(null, seriesTagErrorData);
    }
  }

  public validateScheduleTime(scheduleAt: Date): void {
    const validScheduleTime = moment().add(30, 'minutes');
    if (moment(scheduleAt).isBefore(validScheduleTime, 'minutes')) {
      throw new ContentInvalidScheduledTimeException();
    }
  }

  public async checkCanPinContent(user: UserDto, groupIds: string[]): Promise<void> {
    await this._authorityAppService.buildAbility(user);

    const canPinPermission = this._authorityAppService.canPinContent(groupIds);

    if (!canPinPermission) {
      throw new ContentNoPinPermissionException();
    }
  }

  public async validateLimitedToAttachSeries(
    contentEntity: ArticleEntity | PostEntity
  ): Promise<void> {
    if (contentEntity.isOverLimitedToAttachSeries()) {
      throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const contentWithArchivedGroups = (await this._contentRepo.findContentWithCache({
      where: { id: contentEntity.getId() },
      include: { shouldIncludeSeries: true },
    })) as ArticleEntity | PostEntity;

    if (!contentWithArchivedGroups) {
      return;
    }

    const series = uniq([
      ...contentEntity.getSeriesIds(),
      ...contentWithArchivedGroups?.getSeriesIds(),
    ]);

    if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
