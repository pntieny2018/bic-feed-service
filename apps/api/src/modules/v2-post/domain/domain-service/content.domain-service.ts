import { CONTENT_STATUS, CONTENT_TARGET, CONTENT_TYPE, ORDER } from '@beincom/constants';
import {
  createCursor,
  CursorPaginationResult,
  getLimitFromAfter,
} from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { uniq } from 'lodash';

import { StringHelper } from '../../../../common/helpers';
import { AUTHORITY_APP_SERVICE_TOKEN, IAuthorityAppService } from '../../../authority';
import {
  AudienceNoBelongContentException,
  ContentAccessDeniedException,
  ContentNotFoundException,
  ContentPinLackException,
  ContentPinNotFoundException,
} from '../exception';
import { ArticleEntity, ContentEntity, PostEntity, SeriesEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IPostValidator,
  POST_VALIDATOR_TOKEN,
} from '../validator/interface';

import {
  GetAudiencesProps,
  GetContentByIdsProps,
  GetContentIdsInNewsFeedProps,
  GetContentIdsInTimelineProps,
  GetContentIdsScheduleProps,
  GetDraftsProps,
  GetImportantContentIdsProps,
  GetScheduledContentProps,
  GroupAudience,
  IContentDomainService,
  PinContentProps,
  ReorderContentProps,
  UpdateSettingsProps,
} from './interface';
import { GetPaginationContentsProps } from '@libs/database/postgres';

export class ContentDomainService implements IContentDomainService {
  private readonly _logger = new Logger(ContentDomainService.name);

  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    private readonly _authorityAppService: IAuthorityAppService
  ) {}

  public async getVisibleContent(
    contentId: string,
    excludeReportedByUserId?: string
  ): Promise<ContentEntity> {
    let contentEntity: ContentEntity;

    if (excludeReportedByUserId) {
      contentEntity = await this._contentRepository.findContentByIdExcludeReportedByUserId(
        contentId,
        excludeReportedByUserId,
        { mustIncludeGroup: true }
      );
    } else {
      contentEntity = await this._contentRepository.findContentById(contentId, {
        mustIncludeGroup: true,
      });
    }

    if (!contentEntity || !contentEntity.isVisible()) {
      throw new ContentNotFoundException();
    }

    return contentEntity;
  }

  public getRawContent(contentEntity: ContentEntity): string {
    if (contentEntity instanceof PostEntity) {
      return StringHelper.removeMarkdownCharacter(contentEntity.get('content'));
    } else if (contentEntity instanceof ArticleEntity) {
      return StringHelper.serializeEditorContentToText(contentEntity.get('content'));
    }
    return null;
  }

  public async getDraftsPagination(
    input: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { authUserId, isProcessing, type } = input;
    return this._contentRepository.getPagination({
      ...input,
      where: {
        createdBy: authUserId,
        status: CONTENT_STATUS.DRAFT,
        ...(isProcessing && {
          status: CONTENT_STATUS.PROCESSING,
        }),
        ...(!isEmpty(type) && {
          type,
        }),
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }

  public async getContentByIds(
    input: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const { ids, authUserId } = input;
    if (!ids.length) {
      return [];
    }
    const contentEntities = await this._contentRepository.findAll({
      where: {
        ids,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeSaved: {
          userId: authUserId,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUserId,
        },
        shouldIncludeReaction: {
          userId: authUserId,
        },
      },
    });

    return contentEntities.sort((a, b) => ids.indexOf(a.getId()) - ids.indexOf(b.getId()));
  }

  public async getContentIdsInNewsFeed(
    props: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>> {
    const {
      isMine,
      type,
      isSaved,
      limit,
      isImportant,
      after,
      before,
      authUserId,
      order = ORDER.DESC,
    } = props;

    if (isImportant) {
      return this.getImportantContentIds({ ...props, isOnNewsfeed: true });
    }

    const getPaginationProps: GetPaginationContentsProps = {
      select: ['id'],
      where: {
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
        inNewsfeedUserId: authUserId,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
        type,
      },
      limit,
      order,
      orderOptions: {
        isPublishedByDesc: true,
      },
      before,
      after,
    };

    if (isMine) {
      getPaginationProps.where.createdBy = authUserId;
    }

    if (isSaved) {
      getPaginationProps.orderOptions.isSavedDateByDesc = true;
      getPaginationProps.include = {
        mustIncludeSaved: {
          userId: authUserId,
        },
      };
    }

    const { rows, meta } = await this._contentRepository.getPagination(getPaginationProps);

    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }

  public async getContentIdsInTimeline(
    props: GetContentIdsInTimelineProps
  ): Promise<CursorPaginationResult<string>> {
    const {
      authUserId,
      groupIds,
      isMine,
      type,
      isSaved,
      isImportant,
      limit,
      before,
      after,
      order = ORDER.DESC,
    } = props;

    if (isImportant) {
      return this.getImportantContentIds(props);
    }

    const { rows, meta } = await this._contentRepository.getPagination({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
        groupIds,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
        createdBy: isMine ? authUserId : undefined,
        savedByUserId: isSaved ? authUserId : undefined,
        type,
      },
      include: {
        mustIncludeGroup: true,
      },
      limit,
      order,
      orderOptions: {
        isPublishedByDesc: true,
      },
      before,
      after,
    });

    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }

  public async getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { beforeDate } = input;

    return this._contentRepository.getPagination({
      ...input,
      where: {
        status: CONTENT_STATUS.WAITING_SCHEDULE,
        scheduledAt: beforeDate,
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }

  public async getContentToBuildMenuSettings(
    contentId: string,
    userId: string
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    return this._contentRepository.findContentByIdInActiveGroup(contentId, {
      shouldIncludeGroup: true,
      shouldIncludeQuiz: true,
      shouldIncludeSaved: {
        userId,
      },
    });
  }

  public async getReportedContentIdsByUser(
    reportUser: string,
    postTypes?: CONTENT_TYPE[]
  ): Promise<string[]> {
    if (!postTypes) {
      return this._contentRepository.getReportedContentIdsByUser({
        reportUser,
        target: [CONTENT_TARGET.ARTICLE, CONTENT_TARGET.POST],
      });
    }

    const target: CONTENT_TARGET[] = [];
    if (postTypes.includes(CONTENT_TYPE.POST)) {
      target.push(CONTENT_TARGET.POST);
    }
    if (postTypes.includes(CONTENT_TYPE.ARTICLE)) {
      target.push(CONTENT_TARGET.ARTICLE);
    }

    return this._contentRepository.getReportedContentIdsByUser({ reportUser, target });
  }

  public async getScheduleContentIds(
    params: GetContentIdsScheduleProps
  ): Promise<CursorPaginationResult<string>> {
    const { userId, groupId, limit, before, after, type, order } = params;
    const findOption: GetPaginationContentsProps = {
      where: {
        type,
        statuses: [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED],
      },
      orderOptions: {
        sortColumn: 'scheduledAt',
        orderBy: order,
      },
      limit,
      before,
      after,
      order,
    };

    if (userId) {
      findOption.where.createdBy = userId;
    }

    if (groupId) {
      findOption.where.groupIds = [groupId];
      findOption.include = {
        mustIncludeGroup: true,
      };
    }

    const { rows, meta } = await this._contentRepository.getPagination(findOption);

    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }

  public async getImportantContentIds(
    props: GetImportantContentIdsProps
  ): Promise<CursorPaginationResult<string>> {
    const { authUserId, isOnNewsfeed, groupIds, type, limit, after } = props;
    const offset = getLimitFromAfter(after);

    const rows = await this._contentRepository.findAll(
      {
        attributes: {
          exclude: ['content'],
        },
        where: {
          type,
          groupIds,
          isHidden: false,
          isImportant: true,
          groupArchived: false,
          status: CONTENT_STATUS.PUBLISHED,
          excludeReportedByUserId: authUserId,
          inNewsfeedUserId: isOnNewsfeed ? authUserId : undefined,
        },
        include: {
          ...(groupIds && {
            mustIncludeGroup: true,
          }),
          shouldIncludeImportant: {
            userId: authUserId,
          },
        },
        orderOptions: {
          isImportantFirst: true,
          isPublishedByDesc: true,
        },
      },
      {
        offset,
        limit: limit + 1,
      }
    );

    const hasMore = rows.length > limit;

    if (hasMore) {
      rows.pop();
    }

    return {
      rows: rows.map((row) => row.getId()),
      meta: {
        hasNextPage: hasMore,
        endCursor: rows.length > 0 ? createCursor({ offset: limit + offset }) : undefined,
      },
    };
  }

  public async getSeriesInContent(contentId: string, authUserId: string): Promise<SeriesEntity[]> {
    const contentEntity = (await this._contentRepository.findContentByIdExcludeReportedByUserId(
      contentId,
      authUserId,
      {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
      }
    )) as PostEntity | ArticleEntity;

    if (!contentEntity || contentEntity.isInArchivedGroups()) {
      throw new ContentNotFoundException();
    }

    if (
      (contentEntity.isDraft() || contentEntity.isHidden()) &&
      !contentEntity.isOwner(authUserId)
    ) {
      throw new ContentAccessDeniedException();
    }

    const seriesIds = contentEntity.getSeriesIds();

    if (seriesIds.length === 0) {
      return [];
    }

    const seriesEntites = (await this._contentRepository.findAll({
      where: {
        ids: seriesIds,
      },
    })) as SeriesEntity[];

    return seriesEntites;
  }

  public async updateSetting(props: UpdateSettingsProps): Promise<void> {
    const { contentId, authUser, canReact, canComment, isImportant, importantExpiredAt } = props;

    const contentEntity: ContentEntity = await this._contentRepository.findContentByIdInActiveGroup(
      contentId,
      {
        shouldIncludeGroup: true,
      }
    );
    if (!contentEntity || contentEntity.isHidden()) {
      throw new ContentNotFoundException();
    }

    await this._postValidator.checkCanEditContentSetting(authUser, contentEntity.get('groupIds'));
    contentEntity.setSetting({
      canComment,
      canReact,
      isImportant,
      importantExpiredAt,
    });
    await this._contentRepository.update(contentEntity);

    if (isImportant) {
      await this._contentRepository.markReadImportant(contentId, authUser.id);
    }
  }

  public async markSeen(contentId: string, userId: string): Promise<void> {
    const hasSeen = await this._contentRepository.hasSeen(contentId, userId);
    if (hasSeen) {
      return;
    }
    return this._contentRepository.markSeen(contentId, userId);
  }

  public async markReadImportant(contentId: string, userId: string): Promise<void> {
    const contentEntity = await this._contentRepository.findOne({
      where: {
        id: contentId,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) {
      return;
    }
    if (contentEntity.isDraft()) {
      return;
    }
    if (!contentEntity.isImportant()) {
      return;
    }

    return this._contentRepository.markReadImportant(contentId, userId);
  }

  public async reorderPinned(props: ReorderContentProps): Promise<void> {
    const { authUser, contentIds, groupId } = props;

    await this._contentValidator.checkCanPinContent(authUser, [groupId]);
    const pinnedContentIds = await this._contentRepository.findPinnedContentIdsByGroupId(groupId);
    if (pinnedContentIds.length === 0) {
      throw new ContentPinNotFoundException();
    }

    const reportedContentIds = await this._contentRepository.getReportedContentIdsByUser({
      reportUser: authUser.id,
      groupId,
    });

    const reportedContentIdsInPinned = pinnedContentIds.filter((id) => {
      return reportedContentIds.includes(id);
    });

    const pinnedContentIdsExcludeReported = pinnedContentIds.filter((id) => {
      return !reportedContentIds.includes(id);
    });

    const contentIdsNotBelong = contentIds.filter(
      (contentId) => !pinnedContentIdsExcludeReported.includes(contentId)
    );
    if (contentIdsNotBelong.length > 0) {
      throw new ContentPinNotFoundException(null, { contentsDenied: contentIdsNotBelong });
    }

    const contentIdsNotFound = pinnedContentIdsExcludeReported.filter(
      (contentId) => !contentIds.includes(contentId)
    );
    if (contentIdsNotFound.length > 0) {
      throw new ContentPinLackException(null, { contentsLacked: contentIdsNotFound });
    }

    // get index of each reportedContentIds in pinnedContentIds
    const reportedContentIdsIndexInPinned = reportedContentIdsInPinned.map((id) => {
      return pinnedContentIdsExcludeReported.indexOf(id);
    });

    reportedContentIdsInPinned.forEach((id, index) => {
      // insert id into contentIds at index reportedContentIdsIndexInPinned[index]
      contentIds.splice(reportedContentIdsIndexInPinned[index], 0, id);
    });

    return this._contentRepository.reorderPinnedContent(contentIds, groupId);
  }

  public async findPinnedOrder(
    groupId: string,
    userId: string
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const contentIds = await this._contentRepository.findPinnedContentIdsByGroupId(groupId);
    if (contentIds.length === 0) {
      return [];
    }
    const reportedContentIds = await this._contentRepository.getReportedContentIdsByUser({
      reportUser: userId,
      groupId,
    });

    const pinnedContentIds = contentIds.filter((id) => {
      return !reportedContentIds.includes(id);
    });

    return this.getContentByIds({
      authUserId: userId,
      ids: pinnedContentIds,
    });
  }

  public async updatePinnedContent(props: PinContentProps): Promise<void> {
    const { authUser, contentId, unpinGroupIds, pinGroupIds } = props;

    const content = await this._contentRepository.findOne({
      where: {
        id: contentId,
        isHidden: false,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
      },
    });

    if (!content) {
      throw new ContentNotFoundException();
    }

    const postGroups = content.getPostGroups();
    const currentGroupIds = content.getGroupIds();
    const currentPinGroupIds = [];
    const currentUnpinGroupIds = [];

    for (const postGroup of postGroups) {
      if (postGroup.isPinned) {
        currentPinGroupIds.push(postGroup.groupId);
      }
      if (!postGroup.isPinned) {
        currentUnpinGroupIds.push(postGroup.groupId);
      }
    }

    const newGroupIdsPinAndUnpin = uniq([...unpinGroupIds, ...pinGroupIds]);

    const groupIdsNotBelong = newGroupIdsPinAndUnpin.every((groupId) =>
      currentGroupIds.includes(groupId)
    );

    if (!groupIdsNotBelong) {
      throw new AudienceNoBelongContentException();
    }

    await this._contentValidator.checkCanPinContent(authUser, newGroupIdsPinAndUnpin);

    const addPinGroupIds = pinGroupIds.filter((groupId) => !currentPinGroupIds.includes(groupId));
    const addUnpinGroupIds = unpinGroupIds.filter(
      (groupId) => !currentUnpinGroupIds.includes(groupId)
    );

    await this._contentRepository.pinContent(contentId, addPinGroupIds);
    await this._contentRepository.unpinContent(contentId, addUnpinGroupIds);
  }

  public async getAudiences(props: GetAudiencesProps): Promise<GroupAudience[]> {
    const content = await this._contentRepository.findContentByIdInActiveGroup(props.contentId, {
      mustIncludeGroup: true,
    });

    if (!content || content.isHidden()) {
      throw new ContentNotFoundException();
    }

    const groups = content.getPostGroups() || [];

    const listPinnedContentIds = {};
    const groupIds = [];
    groups.forEach((group) => {
      groupIds.push(group.groupId);
      listPinnedContentIds[group.groupId] = group.isPinned;
    });

    let dataGroups = await this._groupAdapter.getGroupsByIds(groupIds);

    if (props.pinnable) {
      await this._authorityAppService.buildAbility(props.authUser);
      dataGroups = dataGroups.filter((group) =>
        this._authorityAppService.canPinContent([group.id])
      );
    }

    return dataGroups.map(
      (group): GroupAudience => ({
        id: group.id,
        name: group.name,
        isPinned: listPinnedContentIds[group.id],
      })
    );
  }

  public async saveContent(contentId: string, authUser: UserDto): Promise<void> {
    const content = await this._contentRepository.findContentByIdInActiveGroup(contentId);

    if (!content || !content.isPublished()) {
      throw new ContentNotFoundException();
    }

    return this._contentRepository.saveContent(authUser.id, contentId);
  }
}
