import { flatten, uniq } from 'lodash';
import { QueryTypes } from 'sequelize';
import { Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { GroupPrivacy } from '../modules/v2-group/data-type';
import { PostGroupModel } from '../database/models/post-group.model';
import { IPost, PostModel, PostPrivacy, PostStatus } from '../database/models/post.model';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../modules/v2-group/application';
import { getDatabaseConfig } from '@libs/database/postgres/config';

@Command({ name: 'fix:content-privacy', description: 'Fix privacy for posts/article/series' })
export class FixContentPrivacyCommand implements CommandRunner {
  private _logger = new Logger(FixContentPrivacyCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly groupAppService: IGroupApplicationService
  ) {}

  public async run(): Promise<any> {
    const limitEach = 300;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    let totalKeep = 0;
    let totalError = 0;
    let totalUpdated = 0;
    let groupPrivacyMapper = new Map<string, GroupPrivacy>();

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

  private async _getPostsToUpdate(offset: number, limit: number): Promise<IPost[]> {
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
        status: PostStatus.PUBLISHED,
        isHidden: false,
      },
      offset,
      limit,
      order: [['createdAt', 'desc']],
    });
    return rows;
  }

  private async _updatePrivacy(postId: string, privacy: PostPrivacy): Promise<void> {
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
    groupPrivacyMapper: Map<string, GroupPrivacy>
  ): Promise<Map<string, GroupPrivacy>> {
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

  private _getPrivacy(
    groupIds: string[],
    groupPrivacyMapper: Map<string, GroupPrivacy>
  ): PostPrivacy {
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const groupId of groupIds) {
      if (groupPrivacyMapper.get(groupId) === GroupPrivacy.OPEN) {
        return PostPrivacy.OPEN;
      }
      if (groupPrivacyMapper.get(groupId) === GroupPrivacy.CLOSED) totalOpen++;
      if (groupPrivacyMapper.get(groupId) === GroupPrivacy.PRIVATE) totalPrivate++;
    }

    if (totalOpen > 0) return PostPrivacy.CLOSED;
    if (totalPrivate > 0) return PostPrivacy.PRIVATE;
    return PostPrivacy.SECRET;
  }
}
