import { PRIVACY } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

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
    const { groupId, privacy } = command.payload;

    const limit = 1000;
    let offset = 0;

    while (true) {
      const contentIdsInGroup = await this._contentRepository.findContentIdsByGroupId(groupId, {
        offset,
        limit,
      });
      const updateContentPrivacyMapping = await this._getUpdateContentPrivacyMapping(
        contentIdsInGroup,
        privacy
      );

      for (const [privacy, contentIds] of Object.entries(updateContentPrivacyMapping)) {
        await this._contentRepository.updateContentPrivacy(contentIds, privacy);
      }

      if (contentIdsInGroup.length < limit) {
        break;
      } else {
        offset += limit;
      }
    }
  }

  private async _getUpdateContentPrivacyMapping(
    contentIds: string[],
    privacy: PRIVACY
  ): Promise<{ [privacy: string]: string[] }> {
    const contentGroups = await this._contentRepository.findContentGroupsByContentIds(contentIds);

    const groupIds = uniq(contentGroups.map((contentGroup) => contentGroup.groupId));
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);

    const groupPrivacyMapping: { [id: string]: PRIVACY } = groups.reduce((mapping, group) => {
      mapping[group.id] = group.privacy;
      return mapping;
    }, {});

    const postPrivacyMapping: { [id: string]: PRIVACY } = contentGroups.reduce(
      (mapping, { contentId, groupId }) => {
        if (!mapping[contentId]) {
          mapping[contentId] = this._getContentPrivacyByCompareGroupPrivacy(
            groupPrivacyMapping[groupId],
            privacy
          );
        } else {
          mapping[contentId] = this._getContentPrivacyByCompareGroupPrivacy(
            groupPrivacyMapping[groupId],
            mapping[contentId]
          );
        }

        return mapping;
      },
      {}
    );

    const updateContentPrivacyMapping: { [privacy: string]: string[] } = {};
    for (const [contentId, privacy] of Object.entries(postPrivacyMapping)) {
      if (!updateContentPrivacyMapping[privacy]) {
        updateContentPrivacyMapping[privacy] = [contentId];
      } else {
        updateContentPrivacyMapping[privacy].push(contentId);
      }
    }

    return updateContentPrivacyMapping;
  }

  private _getContentPrivacyByCompareGroupPrivacy(
    groupPrivacy: PRIVACY,
    contentPrivacy: PRIVACY
  ): PRIVACY {
    if (groupPrivacy === PRIVACY.OPEN || contentPrivacy === PRIVACY.OPEN) {
      return PRIVACY.OPEN;
    }
    if (groupPrivacy === PRIVACY.CLOSED || contentPrivacy === PRIVACY.CLOSED) {
      return PRIVACY.CLOSED;
    }
    if (groupPrivacy === PRIVACY.PRIVATE || contentPrivacy === PRIVACY.PRIVATE) {
      return PRIVACY.PRIVATE;
    }
    return PRIVACY.SECRET;
  }
}
