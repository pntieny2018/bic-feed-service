import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { PostGroupModel } from '../database/models/post-group.model';
import { MediaModel } from '../database/models/media.model';
import { PostResponseDto } from '../modules/post/dto/responses';
import { plainToInstance } from 'class-transformer';
import { UserService } from '../shared/user';
import { GroupService } from '../shared/group';
import { Logger } from '@nestjs/common';
import { MentionModel } from '../database/models/mention.model';
import { MentionService } from '../modules/mention';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from '../config/elasticsearch';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchHelper, StringHelper } from '../common/helpers';
@Command({ name: 'reindex:es:post', description: 'Reindex es post' })
export class ReIndexEsPostCommand implements CommandRunner {
  private _logger = new Logger(ReIndexEsPostCommand.name);
  public constructor(
    public readonly userService: UserService,
    public readonly groupService: GroupService,
    public readonly mentionService: MentionService,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    private _configService: ConfigService,
    protected readonly elasticsearchService: ElasticsearchService
  ) {}

  public async run(): Promise<any> {
    const limitEach = 200;
    let offset = 0;
    let hasMore = true;
    let total = 0;
    await this._deleteAllDocuments();
    while (hasMore) {
      const posts = await this._getPostsToSync(offset, limitEach);
      if (posts.length === 0) {
        hasMore = false;
      } else {
        await this._addPostsToSearch(posts);
        offset = offset + limitEach;
        total += posts.length;
      }
    }

    console.log('DONE - total:', total);
  }

  private async _getPostsToSync(offset: number, limit: number): Promise<any> {
    const posts = await this._postModel.findAll({
      where: {
        isDraft: false,
        isProcessing: false,
      },
      attributes: {
        exclude: ['updatedBy'],
      },
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId'],
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: [
            'id',
            'url',
            'type',
            'name',
            'width',
            'height',
            'size',
            'thumbnails',
            'status',
            'mimeType',
            'createdAt',
          ],
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
      ],
      limit,
      offset,
    });

    const jsonPosts = posts.map((r) => r.toJSON());
    await Promise.all([
      this.mentionService.bindToPosts(jsonPosts),
      this._bindActorToPost(jsonPosts),
      this._bindAudienceToPost(jsonPosts),
    ]);
    return plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });
  }

  private async _bindAudienceToPost(posts: any[]): Promise<void> {
    const groupIds = [];
    for (const post of posts) {
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch

      if (postGroups && postGroups.length) {
        groupIds.push(...postGroups.map((m) => m.groupId || m.id));
      }
    }
    const dataGroups = await this.groupService.getMany(groupIds);
    for (const post of posts) {
      let groups = [];
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch
      if (postGroups && postGroups.length) {
        const mappedGroups = [];
        postGroups.forEach((group) => {
          const dataGroup = dataGroups.find((i) => i.id === group.id || i.id === group.groupId);
          if (dataGroup && dataGroup.child) {
            delete dataGroup.child;
          }
          if (dataGroup) mappedGroups.push(dataGroup);
        });
        groups = mappedGroups;
      }
      post.audience = { groups };
    }
  }

  private async _bindActorToPost(posts: any[]): Promise<void> {
    const userIds = [];
    for (const post of posts) {
      if (post.actor?.id) {
        userIds.push(post.actor.id);
      } else {
        userIds.push(post.createdBy);
      }
    }
    const users = await this.userService.getMany(userIds);
    for (const post of posts) {
      if (post.actor?.id) {
        post.actor = users.find((i) => i.id === post.actor.id);
      } else {
        post.actor = users.find((i) => i.id === post.createdBy);
      }
    }
  }

  private async _addPostsToSearch(posts: any[]): Promise<void> {
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts';
    for (const post of posts) {
      const dataIndex = {
        id: post.id,
        isArticle: post.isArticle,
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
        content: StringHelper.removeMarkdownCharacter(post.content),
        media: post.media,
        mentions: post.mentions,
        audience: post.audience,
        setting: post.setting,
        createdAt: post.createdAt,
        actor: post.actor,
        lang: post.lang,
      };

      const syncResult = await this.elasticsearchService.index({
        index,
        id: dataIndex.id,
        body: dataIndex,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      });
      const langEs = syncResult.body._index.slice(index.length + 1, index.length + 3);
      const lang = ElasticsearchHelper.LANGUAGES_SUPPORTED.includes(langEs) ? langEs : null;

      await this._postModel.update(
        { lang },
        {
          where: {
            id: dataIndex.id,
          },
        }
      );
      console.log(`Indexed post ${dataIndex.id}`);
    }
  }

  private async _deleteAllDocuments(): Promise<void> {
    const index =
      this._configService.get<IElasticsearchConfig>('elasticsearch').namespace + '_posts*';

    // eslint-disable-next-line @typescript-eslint/naming-convention
    await this.elasticsearchService.deleteByQuery({ index, body: { query: { match_all: {} } } });
    console.log(`Deleted all documents`);
  }
}
