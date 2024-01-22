import { CONTENT_STATUS, PRIVACY } from '@beincom/constants';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostAttributes, PostGroupModel, PostModel } from '@libs/database/postgres/model';
import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { flatten, uniq } from 'lodash';
import { Command, CommandRunner } from 'nest-commander';
import { QueryTypes } from 'sequelize';

@Command({ name: 'fix:content-privacy', description: 'Fix privacy for posts/article/series' })
export class FixContentPrivacyCommand implements CommandRunner {
  private _logger = new Logger(FixContentPrivacyCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly groupAppService: IGroupService
  ) {}

  public async run(): Promise<any> {
    const limitEach = 300;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    let totalKeep = 0;
    let totalError = 0;
    let totalUpdated = 0;
    let groupPrivacyMapper = new Map<string, PRIVACY>();

    while (hasMore) {
      const posts = await this._getPostsToUpdate(offset, limitEach);
      if (posts.length === 0) {
        hasMore = false;
      } else {
        let updated = 0;
        let keep = 0;
        let error = 0;
        const groupIds = uniq(
          flatten(posts.map((post) => post.groups.map((group) => group.groupId)))
        );
        groupPrivacyMapper = await this._buildGroupPrivacy(groupIds, groupPrivacyMapper);
        for (const post of posts) {
          if (post.groups.length) {
            try {
              const privacy = this._getPrivacy(
                post.groups.map((group) => group.groupId),
                groupPrivacyMapper
              );
              await this._updatePrivacy(post.id, privacy);
              updated++;
            } catch (e) {
              error++;
            }
          } else {
            keep++;
          }
        }
        total += posts.length;
        totalKeep += keep;
        totalError += error;
        totalUpdated += updated;
        offset = offset + limitEach;
        this._logger.log(`Keep ${keep}/${posts.length}`);
        this._logger.log(`Updated ${updated}/${posts.length}`);
        this._logger.log(`Error ${error}/${posts.length}`);
        this._logger.log('-----------------------------------');
      }
    }
    this._logger.log(
      `Done. Total: ${total} - total updated: ${totalUpdated} / ${total} - total keep: ${totalKeep} / ${total} - error: ${totalError} / ${total}`
    );
    process.exit();
  }

  private async _getPostsToUpdate(offset: number, limit: number): Promise<PostAttributes[]> {
    const rows = await this._postModel.findAll({
      attributes: ['id', 'created_at'],
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId', 'isArchived'],
          where: { isArchived: false },
        },
      ],
      where: {
        status: CONTENT_STATUS.PUBLISHED,
        isHidden: false,
      },
      offset,
      limit,
      order: [['createdAt', 'desc']],
    });
    return rows;
  }

  private async _updatePrivacy(postId: string, privacy: PRIVACY): Promise<void> {
    const { schema } = getDatabaseConfig();
    await this._postModel.sequelize.query(
      `UPDATE ${schema}.posts SET privacy = :privacy WHERE id = :postId`,
      {
        replacements: {
          postId,
          privacy,
        },
        type: QueryTypes.UPDATE,
      }
    );
  }

  private async _buildGroupPrivacy(
    groupIds: string[],
    groupPrivacyMapper: Map<string, PRIVACY>
  ): Promise<Map<string, PRIVACY>> {
    const groupsIdsNeedToFind = groupIds.filter((groupId) => !groupPrivacyMapper.has(groupId));

    if (groupsIdsNeedToFind.length) {
      const chunkSize = 30;
      for (let i = 0; i < groupsIdsNeedToFind.length; i += chunkSize) {
        const chunk = groupsIdsNeedToFind.slice(i, i + chunkSize);
        const groups = await this.groupAppService.findAllByIds(chunk);
        groups.forEach((group) => groupPrivacyMapper.set(group.id, group.privacy));
      }
    }

    return groupPrivacyMapper;
  }

  private _getPrivacy(groupIds: string[], groupPrivacyMapper: Map<string, PRIVACY>): PRIVACY {
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const groupId of groupIds) {
      if (groupPrivacyMapper.get(groupId) === PRIVACY.OPEN) {
        return PRIVACY.OPEN;
      }
      if (groupPrivacyMapper.get(groupId) === PRIVACY.CLOSED) {
        totalOpen++;
      }
      if (groupPrivacyMapper.get(groupId) === PRIVACY.PRIVATE) {
        totalPrivate++;
      }
    }

    if (totalOpen > 0) {
      return PRIVACY.CLOSED;
    }
    if (totalPrivate > 0) {
      return PRIVACY.PRIVATE;
    }
    return PRIVACY.SECRET;
  }
}
