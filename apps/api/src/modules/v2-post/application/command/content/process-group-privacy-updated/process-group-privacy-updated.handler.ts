import { ORDER } from '@beincom/constants';
import { IPaginatedInfo } from '@libs/database/postgres/common';
import { GroupDto } from '@libs/service/group';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isBoolean } from 'class-validator';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';

import { ProcessGroupPrivacyUpdatedCommand } from './process-group-privacy-updated.command';

@CommandHandler(ProcessGroupPrivacyUpdatedCommand)
export class ProcessGroupPrivacyUpdatedHandler
  implements ICommandHandler<ProcessGroupPrivacyUpdatedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async execute(command: ProcessGroupPrivacyUpdatedCommand): Promise<void> {
    const { groupId } = command.payload;

    const groups: GroupDto[] = [];

    await this._recursiveUpdateContentPrivacy(groupId, groups);
  }

  private async _recursiveUpdateContentPrivacy(
    groupId: string,
    groups: GroupDto[],
    metadata?: IPaginatedInfo
  ): Promise<void> {
    const { hasNextPage, endCursor } = metadata || {};

    if (isBoolean(hasNextPage) && hasNextPage === false) {
      return;
    }

    const { rows, meta } = await this._contentRepository.getPagination({
      where: {
        groupIds: [groupId],
      },
      include: {
        mustIncludeGroup: true,
      },
      limit: 1000,
      order: ORDER.DESC,
      after: endCursor,
    });

    if (!rows || rows.length === 0) {
      return;
    }

    const groupsInContents = await this._getGroupsInContents(rows, groups);
    groups.push(...groupsInContents);

    await this._updateContentsPrivacy(rows, groups);

    await this._recursiveUpdateContentPrivacy(groupId, groups, meta);
  }

  private async _getGroupsInContents(
    contents: (PostEntity | ArticleEntity | SeriesEntity)[],
    groups: GroupDto[]
  ): Promise<GroupDto[]> {
    const groupIds = contents.map((content) => content.getGroupIds()).flat();
    const groupIdsNeedToFind = groupIds.filter((id) => !groups.find((group) => group.id === id));
    const groupsNeedToFind = await this._groupAdapter.getGroupsByIds(groupIdsNeedToFind);

    return groupsNeedToFind;
  }

  private async _updateContentsPrivacy(
    contents: (PostEntity | ArticleEntity | SeriesEntity)[],
    groups: GroupDto[]
  ): Promise<void> {
    for (const content of contents) {
      const groupIds = content.getGroupIds();
      const groupsInContents = groups.filter((group) => groupIds.includes(group.id));

      content.setPrivacyFromGroups(groupsInContents);
    }

    const contentsChanged = contents.filter((content) => content.isChanged());

    const contentPrivacyMapping: { [privacy: string]: string[] } = contentsChanged.reduce(
      (mapping, content) => {
        const privacy = content.getPrivacy();
        if (!mapping[privacy]) {
          mapping[privacy] = [content.getId()];
        } else {
          mapping[privacy].push(content.getId());
        }
        return mapping;
      },
      {}
    );

    for (const [privacy, contentIds] of Object.entries(contentPrivacyMapping)) {
      await this._contentRepository.updateContentPrivacy(contentIds, privacy);
    }
  }
}
