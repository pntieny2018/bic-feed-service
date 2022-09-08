import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { PostGroupModel } from '../database/models/post-group.model';
import { MediaModel } from '../database/models/media.model';
import { PostResponseDto } from '../modules/post/dto/responses';
import { plainToInstance } from 'class-transformer';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { UserService } from '../shared/user';
import { GroupService } from '../shared/group';
import { Logger } from '@nestjs/common';
import { MentionModel } from '../database/models/mention.model';
import { MentionService } from '../modules/mention';
import { ElasticsearchHelper, StringHelper } from '../common/helpers';
@Command({ name: 'reindex:es:post', description: 'Reindex es post' })
export class ReIndexEsPostCommand implements CommandRunner {
  private _logger = new Logger(ReIndexEsPostCommand.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    public readonly userService: UserService,
    public readonly groupService: GroupService,
    public readonly mentionService: MentionService,
    @InjectModel(PostModel) private _postModel: typeof PostModel
  ) {}

  public async run(passedParam: string[]): Promise<any> {
    if (passedParam.length === 0) return;
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
    });

    const jsonPosts = posts.map((r) => r.toJSON());
    await Promise.all([
      this.mentionService.bindMentionsToPosts(jsonPosts),
      this.bindActorToPost(jsonPosts),
      this.bindAudienceToPost(jsonPosts),
    ]);

    for (const post of jsonPosts) {
      const result = plainToInstance(PostResponseDto, post, {
        excludeExtraneousValues: true,
      });
      const dataIndex = {
        id: result.id,
        commentsCount: result.commentsCount,
        totalUsersSeen: result.totalUsersSeen,
        content: StringHelper.removeMarkdownCharacter(result.content),
        media: result.media,
        mentions: result.mentions,
        audience: result.audience,
        setting: result.setting,
        createdAt: result.createdAt,
        actor: result.actor,
        isArticle: result.isArticle,
      };

      this._logger.log('processing post:', dataIndex.id);

      const res = await this._elasticsearchService.index({
        index: passedParam[0],
        id: `${dataIndex.id}`,
        body: dataIndex,
        pipeline: ElasticsearchHelper.PIPE_LANG_IDENT.POST,
      });
      let lang = res.body._index.slice(passedParam[0].length + 1, passedParam[0].length + 3);
      lang = ElasticsearchHelper.LANGUAGES_SUPPORTED.includes(lang) ? lang : null;
      await this._postModel.update(
        { lang },
        {
          where: {
            id: dataIndex.id,
          },
        }
      );
      this._logger.log('deliver post:', dataIndex.id);
    }
    this._logger.log('DONE - total:', posts.length);
  }

  public async bindAudienceToPost(posts: any[]): Promise<void> {
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

  /**
   * Bind Actor info to post.createdBy
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindActorToPost(posts: any[]): Promise<void> {
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
}
