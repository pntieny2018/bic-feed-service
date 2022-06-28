import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { PostGroupModel } from '../database/models/post-group.model';
import { MediaModel } from '../database/models/media.model';
import { PostResponseDto } from '../modules/post/dto/responses';
import { plainToInstance } from 'class-transformer';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { UserSharedDto } from '../shared/user/dto';
import { UserService } from '../shared/user';
import { GroupService } from '../shared/group';
import { Logger } from '@nestjs/common';
@Command({ name: 'reindex:es:post', description: 'Reindex es post' })
export class ReIndexEsPostCommand implements CommandRunner {
  private _logger = new Logger(ReIndexEsPostCommand.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    public readonly userService: UserService,
    public readonly groupService: GroupService,
    @InjectModel(PostModel) private _postModel: typeof PostModel
  ) {}

  public async run(passedParam: string[], options: { index: string }): Promise<any> {
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
          as: 'media',
          required: false,
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status'],
        },
      ],
    });
    for (const post of posts) {
      const jsonPost = post.toJSON();
      await Promise.all([
        this.bindMentionsToPosts([jsonPost]),
        this.bindActorToPost([jsonPost]),
        this.bindAudienceToPost([jsonPost]),
      ]);

      const result = plainToInstance(PostResponseDto, jsonPost, {
        excludeExtraneousValues: true,
      });

      const dataIndex = {
        id: result.id,
        commentsCount: result.commentsCount,
        totalUsersSeen: result.totalUsersSeen,
        content: result.content,
        media: result.media,
        mentions: result.mentions,
        audience: result.audience,
        setting: result.setting,
        createdAt: result.createdAt,
        actor: result.actor,
      };

      this._logger.log('processing post:', dataIndex.id);

      await this._elasticsearchService
        .index({ index: passedParam[0], id: `${dataIndex.id}`, body: dataIndex })
        .catch((ex) => this._logger.debug(ex));

      this._logger.log('deliver post:', dataIndex.id);
    }
  }

  public async bindMentionsToPosts(posts: any[]): Promise<void> {
    const userIds: number[] = [];

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        userIds.push(...post.mentions.map((m) => m.userId));
      }
    }

    const usersInfo = await this.resolveMentions(userIds);

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        const mentions = [];
        post.mentions.forEach((mention) => {
          const user = usersInfo.find((u) => u.id === mention.userId);
          if (user) mentions.push(user);
        });
        post.mentions = mentions.reduce((obj, cur) => ({ ...obj, [cur.username]: cur }), {});
      }
    }
  }
  public async resolveMentions(userIds: number[]): Promise<UserSharedDto[]> {
    if (!userIds.length) return [];
    const users = await this.userService.getMany(userIds);
    return plainToInstance(UserSharedDto, users, {
      excludeExtraneousValues: true,
    });
  }
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
}
