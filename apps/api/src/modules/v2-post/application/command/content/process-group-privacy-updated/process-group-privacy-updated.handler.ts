import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { IPaginatedInfo } from '@libs/database/postgres/common';
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

    await this._recursiveUpdateContentPrivacy(groupId);
  }

  private async _recursiveUpdateContentPrivacy(
    groupId: string,
    metadata?: IPaginatedInfo
  ): Promise<void> {
    const { hasNextPage, endCursor } = metadata || {};

    if (isBoolean(hasNextPage) && hasNextPage === false) {
      return;
    }

    const { rows, meta } = await this._contentRepository.getPagination({
      where: {
        groupIds: [groupId],
        groupArchived: false,
        status: CONTENT_STATUS.PUBLISHED,
        isHidden: false,
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

    await this._updateContentsPrivacy(rows);

    await this._recursiveUpdateContentPrivacy(groupId, meta);
  }

  private async _updateContentsPrivacy(
    contents: (PostEntity | ArticleEntity | SeriesEntity)[]
  ): Promise<void> {
    for (const content of contents) {
      const groupIds = content.getGroupIds();
      const groups = await this._groupAdapter.getGroupsByIds(groupIds);

      content.setPrivacyFromGroups(groups);
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
