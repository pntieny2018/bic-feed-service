import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { IElasticsearchConfig } from '@libs/common/config/elasticsearch';
import {
  CategoryModel,
  LinkPreviewModel,
  PostGroupModel,
  PostModel,
  PostSeriesModel,
} from '@libs/database/postgres/model';
import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Sequelize } from 'sequelize';

import { ElasticsearchHelper } from '../../common/helpers';
import { IDataPostToAdd } from '../../modules/search/interfaces/post-elasticsearch.interface';
import { SearchService } from '../../modules/search/search.service';

import { POST_DEFAULT_MAPPING } from './post_default_mapping';
import { POST_EN_MAPPING } from './post_en_mapping';
import { POST_ES_MAPPING } from './post_es_mapping';
import { POST_JA_MAPPING } from './post_ja_mapping';
import { POST_KO_MAPPING } from './post_ko_mapping';
import { POST_RU_MAPPING } from './post_ru_mapping';
import { POST_VI_MAPPING } from './post_vi_mapping';
import { POST_ZH_MAPPING } from './post_zh_mapping';

interface ICommandOptions {
  oldIndex?: string;
  updateIndex: boolean;
}

//npx ts-node -r tsconfig-paths/register apps/api/src/command/cli.ts es:index-post --update-index --old-index=8-12-2022
//node dist/src/command/cli.js es:index-post --update-index --old-index=001
@Command({ name: 'es:index-post', description: 'Reindex post in elasticsearch' })
export class IndexPostCommand implements CommandRunner {
  private _logger = new Logger(IndexPostCommand.name);
  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @Inject(GROUP_SERVICE_TOKEN)
    public readonly groupAppService: IGroupService,
    public readonly postSearchService: SearchService,
    private readonly _configService: ConfigService,
    protected readonly elasticsearchService: ElasticsearchService
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public delay(time: any): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  @Option({
    flags: '-s, --old-index [string]',
  })
  public parseString(val: string): string {
    return val;
  }

  @Option({
    flags: '-s, --update-index [boolean]',
  })
  public parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  public async run(params: string[] = [], options?: ICommandOptions): Promise<any> {
    const shouldUpdateIndex = options.updateIndex ?? false;
    const currentDefaultIndex =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts';

    const prevVersionDate = options.oldIndex ?? null;
    const today = new Date();
    const currentDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    if (shouldUpdateIndex) {
      this._logger.log('Deleting all indexs...');
      await this._deleteIndex();
      this._logger.log('Creating new indexs...');
      await this._createNewIndex(`${currentDefaultIndex}_${currentDate}`, POST_DEFAULT_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_vi_${currentDate}`, POST_VI_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_en_${currentDate}`, POST_EN_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_es_${currentDate}`, POST_ES_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_ru_${currentDate}`, POST_RU_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_ko_${currentDate}`, POST_KO_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_ja_${currentDate}`, POST_JA_MAPPING);
      await this._createNewIndex(`${currentDefaultIndex}_zh_${currentDate}`, POST_ZH_MAPPING);

      await this._updateAlias(currentDefaultIndex, prevVersionDate, currentDate);
    }
    await this._deleteAllDocuments();
    try {
      await this._indexPost();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }

    process.exit();
  }

  private async _createNewIndex(indexName, mapping): Promise<boolean> {
    try {
      const createIndexResult = await this.elasticsearchService.indices.create({
        index: indexName,
        ...mapping,
      });
      this._logger.log('Created index ' + JSON.stringify(createIndexResult, null, 4));
      return true;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      return false;
    }
  }
  private async _removeIndex(indexName): Promise<boolean> {
    try {
      const deleteIndexResult = await this.elasticsearchService.indices.delete({
        index: indexName,
      });
      this._logger.log('Deleted index' + JSON.stringify(deleteIndexResult, null, 4));
      return true;
    } catch (e) {
      return false;
    }
  }

  private async _updateAlias(currentDefaultIndex, prevVersionDate, currentDate): Promise<void> {
    this._logger.log('Updating alias...');
    const actionList: any = [
      {
        add: {
          index: `${currentDefaultIndex}_${currentDate}`,
          alias: currentDefaultIndex,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_write_index: true,
        },
      },
    ];

    if (prevVersionDate) {
      actionList.push({
        remove: {
          index: `${currentDefaultIndex}_${prevVersionDate}`,
          alias: currentDefaultIndex,
        },
      });
    }

    ElasticsearchHelper.LANGUAGES_SUPPORTED.forEach((lang) => {
      actionList.push({
        add: {
          index: `${currentDefaultIndex}_${lang}_${currentDate}`,
          alias: `${currentDefaultIndex}_${lang}`,
          //eslint-disable-next-line @typescript-eslint/naming-convention
          is_write_index: true,
        },
      });
      if (prevVersionDate) {
        actionList.push({
          remove: {
            index: `${currentDefaultIndex}_${lang}_${prevVersionDate}`,
            alias: `${currentDefaultIndex}_${lang}`,
          },
        });
      }
    });

    const updateAliasResult = await this.elasticsearchService.indices.updateAliases({
      actions: actionList,
    });

    this._logger.log('Updated alias: ', updateAliasResult);
  }

  private async _indexPost(): Promise<void> {
    const limitEach = 100;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    let created = 0;
    let updated = 0;
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts';
    while (hasMore) {
      const posts = await this._getPostsToSync(offset, limitEach);
      if (posts.length === 0) {
        hasMore = false;
      } else {
        const insertDataPosts = [];
        for (const postData of posts) {
          const post = postData.toJSON();
          const groupIds = post.groups.map((group) => group.groupId);
          const groups = await this.groupAppService.findAllByIds(groupIds);
          const communityIds = groups.map((group) => group.rootGroupId);
          const item: IDataPostToAdd = {
            id: post.id,
            type: post.type,
            isHidden: false,
            groupIds,
            communityIds,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt,
            createdBy: post.createdBy,
          };
          const tagList = post.tagsJson ?? [];
          item.tags = tagList.map((tag) => ({
            id: tag.id,
            name: tag.name,
            groupId: tag.groupId,
          }));
          if (post.type === CONTENT_TYPE.POST) {
            item.title = post.title;
            item.content = post.content;
            item.media = post.mediaJson;
            item.mentionUserIds = post.mentions;
            item.seriesIds = post.seriesIds;
          }
          if (post.type === CONTENT_TYPE.ARTICLE) {
            item.title = post.title;
            item.summary = post.summary;
            item.content = post.content;
            item.coverMedia = post.coverJson;
            item.categories = post.categories.map((category) => ({
              id: category.id,
              name: category.name,
            }));
            item.seriesIds = post.seriesIds;
          }
          if (post.type === CONTENT_TYPE.SERIES) {
            item.title = post.title;
            item.summary = post.summary;
            item.itemIds = post.itemIds;
            item.coverMedia = post.coverJson;
          }
          insertDataPosts.push(item);
        }
        const { totalCreated, totalUpdated } = await this.postSearchService.addPostsToSearch(
          insertDataPosts,
          index
        );
        created += totalCreated;
        updated += totalUpdated;
        offset = offset + limitEach;
        total += posts.length;
        this._logger.log(`Created ${totalCreated}/${posts.length}`);
        this._logger.log(`Updated ${totalUpdated}/${posts.length}`);
        this._logger.log('-----------------------------------');
        await this.delay(1000);
      }
    }

    this._logger.log(`Done. Total created: ${created} - total updated: ${updated} / ${total}`);
  }

  private async _getPostsToSync(offset: number, limit: number): Promise<PostModel[]> {
    const postSeriesModel = PostSeriesModel.getTableName();
    const rows = await this._postModel.findAll({
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT array_agg("postSeries".post_id order by zindex asc)
              FROM ${postSeriesModel} as "postSeries"
              WHERE "PostModel"."id" = "postSeries"."series_id"
            )`),
            'itemIds',
          ],
          [
            Sequelize.literal(`(
              SELECT array_agg("ps".series_id)
              FROM ${postSeriesModel} as "ps"
              WHERE "PostModel"."id" = "ps"."post_id"
            )`),
            'seriesIds',
          ],
        ],
        exclude: ['updatedBy'],
      },
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId', 'isArchived'],
          where: { isArchived: false },
        },
        {
          model: CategoryModel,
          as: 'categories',
          required: false,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
        { model: LinkPreviewModel, as: 'linkPreview', required: false },
      ],
      where: {
        status: CONTENT_STATUS.PUBLISHED,
        isHidden: false,
      },
      offset,
      limit,
      order: [['publishedAt', 'asc']],
    });
    return rows;
  }

  private async _deleteAllDocuments(): Promise<void> {
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts*';

    // eslint-disable-next-line @typescript-eslint/naming-convention
    await this.elasticsearchService.deleteByQuery({ index, body: { query: { match_all: {} } } });
    this._logger.log(`Deleted all documents`);
  }

  private async _deleteIndex(): Promise<void> {
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts*';
    const indices = await this.elasticsearchService.indices.get({ index });

    for (const key of Object.keys(indices)) {
      await this._removeIndex(key);
    }
    this._logger.log(`Deleted Index`);
  }
}
