import { CONTENT_TYPE, PERMISSION_KEY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
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
  ContentRequireGroupException,
  TagSeriesInvalidException,
  UserNoBelongGroupException,
} from '../exception';
import { SeriesEntity, ContentEntity, PostEntity, ArticleEntity } from '../model/content';
import { TagEntity } from '../model/tag';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import {
  IUserAdapter,
  USER_ADAPTER,
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface';

import { IContentValidator } from './interface';

@Injectable()
export class ContentValidator implements IContentValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    protected readonly _userAdapter: IUserAdapter,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository
  ) {}

  public async checkCanCRUDContent(
    user: UserDto,
    groupAudienceIds: string[],
    contentType?: CONTENT_TYPE
  ): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const groups = await this._groupAdapter.getGroupsByIds(groupAudienceIds);
    await this._authorityAppService.buildAbility(user);
    const permissionKey = this._postTypeToPermissionKey(contentType);
    for (const group of groups) {
      if (!this._authorityAppService.canDoActionOnGroup(permissionKey, group.id)) {
        notCreatableInGroups.push(group);
      }
    }

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

    const postType = contentEntity.get('type');
    const state = contentEntity.getState();
    const { detachGroupIds, attachGroupIds } = state;
    const isEnableSetting = contentEntity.isEnableSetting();

    await this.checkCanCRUDContent(userAuth, groupIds, postType);

    if (detachGroupIds?.length) {
      await this.checkCanCRUDContent(userAuth, detachGroupIds, postType);
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
    groups?: GroupDto[]
  ): Promise<void> {
    if (post.isOwner(user.id)) {
      return;
    }

    if (post.isOpen() || post.isClosed()) {
      return;
    }

    const groupAudienceIds = post.get('groupIds') ?? [];
    const isAdmin = await this._groupAdapter.isAdminInAnyGroups(user.id, groupAudienceIds);

    if (isAdmin && !post.isDraft()) {
      return;
    }

    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (groups?.length > 0) {
        throw new ContentRequireGroupException(null, { requireGroups: groups });
      }
      throw new ContentNoCRUDPermissionException();
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
      const series = await this._contentRepository.findAll({
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

    const contentWithArchivedGroups = (await this._contentRepository.findContentByIdInArchivedGroup(
      contentEntity.getId(),
      {
        shouldIncludeSeries: true,
      }
    )) as ArticleEntity | PostEntity;

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
