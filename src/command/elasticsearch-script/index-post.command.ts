import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { plainToInstance } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from '../../config/elasticsearch';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PostSearchService } from '../../modules/post/post-search.service';
import { PostService } from '../../modules/post/post.service';
import { PostBindingService } from '../../modules/post/post-binding.service';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { ElasticsearchHelper } from '../../common/helpers';
import { POST_DEFAULT_MAPPING } from './post_default_mapping';
import { POST_VI_MAPPING } from './post_vi_mapping';
import { POST_EN_MAPPING } from './post_en_mapping';
import { POST_ES_MAPPING } from './post_es_mapping';
import { POST_JA_MAPPING } from './post_ja_mapping';
import { POST_KO_MAPPING } from './post_ko_mapping';
import { POST_ZH_MAPPING } from './post_zh_mapping';
import { POST_RU_MAPPING } from './post_ru_mapping';

interface ICommandOptions {
  oldIndex?: string;
  updateIndex: boolean;
}

//npx ts-node -r tsconfig-paths/register src/command/cli.ts es:index-post --update-index --old-index=18-08-2022
@Command({ name: 'es:index-post', description: 'Reindex post in elasticsearch' })
export class IndexPostCommand implements CommandRunner {
  private _logger = new Logger(IndexPostCommand.name);
  public constructor(
    public readonly postSearchService: PostSearchService,
    public readonly postService: PostService,
    public readonly postBingdingService: PostBindingService,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    private _configService: ConfigService,
    protected readonly elasticsearchService: ElasticsearchService
  ) {}

  public delay(time) {
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
    const currentDate = `${today.getDate()}-${today.getMonth()}-${today.getFullYear()}`;

    if (prevVersionDate && shouldUpdateIndex) {
      console.log('updating index...');
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
      console.log('Created index ' + JSON.stringify(createIndexResult, null, 4));
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  private async _removeIndex(indexName): Promise<boolean> {
    try {
      const deleteIndexResult = await this.elasticsearchService.indices.delete({
        index: indexName,
      });
      console.log('Deleted index' + JSON.stringify(deleteIndexResult, null, 4));
      return true;
    } catch (e) {
      return false;
    }
  }

  private async _updateAlias(currentDefaultIndex, prevVersionDate, currentDate): Promise<void> {
    console.log('Updating alias...');
    const actionList = [
      {
        add: {
          index: `${currentDefaultIndex}_${currentDate}`,
          alias: currentDefaultIndex,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_write_index: true,
        },
      },
      // {
      //   remove: {
      //     index: `${currentDefaultIndex}_${prevVersionDate}`,
      //     alias: currentDefaultIndex,
      //   },
      // },
    ];

    ElasticsearchHelper.LANGUAGES_SUPPORTED.forEach((lang) => {
      actionList.push({
        add: {
          index: `${currentDefaultIndex}_${lang}_${currentDate}`,
          alias: `${currentDefaultIndex}_${lang}`,
          //eslint-disable-next-line @typescript-eslint/naming-convention
          is_write_index: true,
        },
      });
      // actionList.push({
      //   remove: {
      //     index: `${currentDefaultIndex}_${lang}_${prevVersionDate}`,
      //     alias: `${currentDefaultIndex}_${lang}`,
      //   },
      // });
    });

    const updateAliasResult = await this.elasticsearchService.indices.updateAliases({
      actions: actionList,
    });

    console.log('Updated alias: ', updateAliasResult);
  }

  private async _indexPost(): Promise<void> {
    const limitEach = 5;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts';
    while (hasMore) {
      const posts = await this._getPostsToSync(offset, limitEach);
      if (posts.length === 0) {
        hasMore = false;
      } else {
        await this.postSearchService.addPostsToSearch(posts, index);
        offset = offset + limitEach;
        total += posts.length;
        console.log(`Indexed ${posts.length}`);
        await this.delay(1000);
        //process.exit();
      }
    }

    console.log('DONE - total:', total);
  }

  private async _getPostsToSync(offset: number, limit: number): Promise<any> {
    const include = this.postService.getIncludeObj({
      shouldIncludeCategory: true,
      shouldIncludeGroup: true,
      shouldIncludeMedia: true,
      shouldIncludeMention: true,
      shouldIncludePreviewLink: true,
      shouldIncludeCover: true,
    });

    const attributes = {
      exclude: ['updatedBy'],
    };
    const rows = await this._postModel.findAll({
      attributes,
      include,
      where: {
        isDraft: false,
      },
      offset,
      limit,
    });

    const jsonPosts = rows.map((r) => r.toJSON());
    const result = this.postBingdingService.bindRelatedData(jsonPosts, {
      shouldBindActor: true,
      shouldBindAudience: true,
      shouldBindMention: true,
    });
    return plainToInstance(ArticleResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  private async _deleteAllDocuments(): Promise<void> {
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts*';

    // eslint-disable-next-line @typescript-eslint/naming-convention
    await this.elasticsearchService.deleteByQuery({ index, body: { query: { match_all: {} } } });
    console.log(`Deleted all documents`);
  }
}
