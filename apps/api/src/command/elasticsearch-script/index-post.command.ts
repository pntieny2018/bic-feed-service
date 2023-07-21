import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel, PostStatus, PostType } from '../../database/models/post.model';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from '../../config/elasticsearch';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PostService } from '../../modules/post/post.service';
import { PostBindingService } from '../../modules/post/post-binding.service';
import { ElasticsearchHelper } from '../../common/helpers';
import { POST_DEFAULT_MAPPING } from './post_default_mapping';
import { POST_VI_MAPPING } from './post_vi_mapping';
import { POST_EN_MAPPING } from './post_en_mapping';
import { POST_ES_MAPPING } from './post_es_mapping';
import { POST_JA_MAPPING } from './post_ja_mapping';
import { POST_KO_MAPPING } from './post_ko_mapping';
import { POST_ZH_MAPPING } from './post_zh_mapping';
import { POST_RU_MAPPING } from './post_ru_mapping';
import { Sequelize } from 'sequelize-typescript';
import { SearchService } from '../../modules/search/search.service';
import { IDataPostToAdd } from '../../modules/search/interfaces/post-elasticsearch.interface';
import { PostGroupModel } from '../../database/models/post-group.model';
import { CategoryModel } from '../../database/models/category.model';
import { LinkPreviewModel } from '../../database/models/link-preview.model';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../modules/v2-group/application';

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
    @Inject(GROUP_APPLICATION_TOKEN)
    public readonly groupAppService: IGroupApplicationService,
    public readonly postSearchService: SearchService,
    public readonly postService: PostService,
    public readonly postBingdingService: PostBindingService,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(PostSeriesModel) private _postSeriesModel: typeof PostSeriesModel,
    private _configService: ConfigService,
    protected readonly elasticsearchService: ElasticsearchService,
    @InjectConnection() private _sequelizeConnection: Sequelize
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

  public async run(params: string[] = [], options?: ICommandOptions): Promise<any> {
    const shouldUpdateIndex = options.updateIndex ?? false;
    const currentDefaultIndex =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts';

    const prevVersionDate = options.oldIndex ?? null;
    const today = new Date();
    const currentDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

    if (shouldUpdateIndex) {
      await this._deleteIndex();
      this._logger.log('updating index...');
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
    await this._indexPost();

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
        for (const post of posts) {
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
          if (post.type === PostType.POST) {
            item.content = post.content;
            item.media = post.mediaJson;
            item.mentionUserIds = post.mentions;
            item.seriesIds = post.postSeries.map((series) => series.seriesId);
          }
          if (post.type === PostType.ARTICLE) {
            item.title = post.title;
            item.summary = post.summary;
            item.content = post.content;
            item.coverMedia = post.coverJson;
            item.categories = post.categories.map((category) => ({
              id: category.id,
              name: category.name,
            }));
            item.seriesIds = post.postSeries.map((series) => series.seriesId);
          }
          if (post.type === PostType.SERIES) {
            item.title = post.title;
            item.summary = post.summary;
            item.items = post.items.map((article) => ({
              id: article.id,
              zindex: article['PostSeriesModel'].zindex,
            }));
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

  private async _getPostsToSync(offset: number, limit: number): Promise<IPost[]> {
    const attributes = {
      exclude: ['updatedBy'],
    };
    const rows = await this._postModel.findAll({
      attributes,
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId', 'isArchived'],
          where: { isArchived: false },
        },
        {
          model: PostModel,
          as: 'items',
          required: false,
          through: { attributes: ['zindex', 'createdAt'] },
          attributes: [
            'id',
            'title',
            'summary',
            'createdBy',
            'canComment',
            'canReact',
            'importantExpiredAt',
          ],
          where: { status: 'PUBLISHED', isHidden: false },
        },
        {
          model: CategoryModel,
          as: 'categories',
          required: false,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
        {
          model: PostSeriesModel,
          as: 'postSeries',
          required: false,
          attributes: ['seriesId'],
        },
        { model: LinkPreviewModel, as: 'linkPreview', required: false },
      ],
      where: {
        status: PostStatus.PUBLISHED,
        isHidden: false,
      },
      offset,
      limit,
      order: [['publishedAt', 'desc']],
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
    await this.elasticsearchService.indices.delete({ index });
    this._logger.log(`Deleted Index`);
  }
}
