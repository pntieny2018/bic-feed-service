import { IPaginatedInfo } from '@libs/database/postgres/common';
import { PostGroupAttributes } from '@libs/database/postgres/model';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBoolean } from 'class-validator';

import { SearchService } from '../../../../../search/search.service';
import { GROUP_STATE_VERB } from '../../../../data-type';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IPostGroupRepository,
  POST_GROUP_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { ContentMapper } from '../../../../driven-adapter/mapper/content.mapper';

import { ProcessGroupStateUpdatedCommand } from './process-group-state-updated.command';

@CommandHandler(ProcessGroupStateUpdatedCommand)
export class ProcessGroupStateUpdatedHandler
  implements ICommandHandler<ProcessGroupStateUpdatedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(POST_GROUP_REPOSITORY_TOKEN)
    private readonly _postGroupRepo: IPostGroupRepository,
    private readonly _contentMapper: ContentMapper,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async execute(command: ProcessGroupStateUpdatedCommand): Promise<void> {
    const { groupIds, verb } = command.payload;

    const isArchived = verb === GROUP_STATE_VERB.ARCHIVE;

    const notInStateGroupIds = await this._postGroupRepo.getNotInStateGroupIds(
      groupIds,
      isArchived
    );

    await this._postGroupRepo.updateGroupState(notInStateGroupIds, isArchived);
    await this._recursiveUpdateContent(notInStateGroupIds);
  }

  private async _recursiveUpdateContent(
    groupIds: string[],
    metadata?: IPaginatedInfo
  ): Promise<void> {
    if (!groupIds.length) {
      return;
    }

    const { hasNextPage, endCursor } = metadata || {};

    if (isBoolean(hasNextPage) && hasNextPage === false) {
      return;
    }

    const { rows: postGroups, meta } = await this._postGroupRepo.getPagination({
      where: { groupIds },
      limit: 1000,
      after: endCursor,
    });

    if (!postGroups || postGroups.length === 0) {
      return;
    }

    await this._updateContent(postGroups);

    await this._recursiveUpdateContent(groupIds, meta);
  }

  private async _updateContent(postGroups: PostGroupAttributes[]): Promise<void> {
    const contentIds = postGroups.map((postGroup) => postGroup.postId);
    const contentEntities = await this._contentRepo.findAll({
      where: { ids: contentIds, groupArchived: false },
      include: { mustIncludeGroup: true },
    });

    const updateData = contentEntities.map((content) => ({ groupIds: content.getGroupIds() }));
    const contents = contentEntities.map((content) => this._contentMapper.toPersistence(content));

    await this._postSearchService.updateAttributePostsToSearch(contents, updateData);
  }
}
