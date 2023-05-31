import { Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { PERMISSION_KEY, SUBJECT } from '../../../../common/constants';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionAtGroupException,
  ContentRequireGroupException,
} from '../exception';
import { IContentValidator } from './interface';
import { ContentEntity } from '../model/content/content.entity';
import { AccessDeniedException } from '../exception/access-denied.exception';
import { UserNoBelongGroupException } from '../exception/user-no-belong-group.exception';
import { PostType } from '../../data-type';
import { TagEntity } from '../model/tag';
import { SeriesEntity } from '../model/content';
import { TagSeriesInvalidException } from '../exception/tag-series-invalid.exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

@Injectable()
export class ContentValidator implements IContentValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    protected readonly _contentRepository: IContentRepository
  ) {}

  public async checkCanCRUDContent(
    user: UserDto,
    groupAudienceIds: string[],
    postType?: PostType
  ): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    const permissionKey = this.postTypeToPermissionKey(postType);
    for (const group of groups) {
      if (!ability.can(PERMISSION_KEY[permissionKey], subject(SUBJECT.GROUP, { id: group.id }))) {
        notCreatableInGroups.push(group);
      }
    }

    if (notCreatableInGroups.length) {
      throw new ContentNoCRUDPermissionAtGroupException(
        {
          groupsDenied: notCreatableInGroups.map((e) => e.id),
        },
        notCreatableInGroups.map((e) => e.name)
      );
    }
  }

  public async checkCanEditContentSetting(
    user: UserDto,
    groupAudienceIds: string[]
  ): Promise<void> {
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      if (
        !ability.can(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        )
      ) {
        notEditSettingInGroups.push(group);
      }
    }

    if (notEditSettingInGroups.length) {
      throw new ContentNoEditSettingPermissionAtGroupException(
        {
          groupsDenied: notEditSettingInGroups.map((e) => e.id),
        },
        notEditSettingInGroups.map((e) => e.name)
      );
    }
  }

  public postTypeToPermissionKey(postType: PostType): string {
    switch (postType) {
      case PostType.SERIES:
        return 'CRUD_SERIES';
      case PostType.ARTICLE:
      case PostType.POST:
      default:
        return 'CRUD_POST_ARTICLE';
    }
  }

  public async validatePublishContent(
    contentEntity: ContentEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    if (!contentEntity.isOwner(userAuth.id)) throw new AccessDeniedException();

    if (contentEntity.get('groupIds')?.length === 0) throw new ContentEmptyGroupException();

    const postType = contentEntity.get('type');
    const state = contentEntity.getState();
    const { detachGroupIds, enableSetting } = state;

    await this.checkCanCRUDContent(userAuth, groupIds, postType);

    if (enableSetting) await this.checkCanEditContentSetting(userAuth, groupIds);

    if (detachGroupIds?.length) await this.checkCanCRUDContent(userAuth, detachGroupIds, postType);
  }

  public async validateMentionUsers(userIds: string[], groupIds: string[]): Promise<void> {
    if (!userIds?.length || !groupIds?.length) return;
    const users = await this._userApplicationService.findAllByIds(userIds, {
      withGroupJoined: true,
    });
    const invalidUsers = [];
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException({
        usersDenied: invalidUsers,
      });
    }
  }

  public checkCanReadContent(post: ContentEntity, user: UserDto, groups?: GroupDto[]): void {
    if (!post.isPublished() && post.isOwner(user.id)) return;
    if (post.isOpen() || post.isClosed()) return;
    const groupAudienceIds = post.get('groupIds') ?? [];
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (groups?.length > 0) {
        throw new ContentRequireGroupException({ requireGroups: groups });
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
        attributes: ['id', 'title'],
        include: {
          mustIncludeGroup: true,
        },
        where: {
          ids: seriesIds,
          type: PostType.SERIES,
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
      throw new TagSeriesInvalidException(seriesTagErrorData);
    }
  }
}
