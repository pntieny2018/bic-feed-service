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
import { PostService } from '../modules/post/post.service';
@Command({ name: 'reindex:es:post', description: 'Reindex es post' })
export class ReIndexEsPostCommand implements CommandRunner {
  private _logger = new Logger(ReIndexEsPostCommand.name);
  public constructor(
    private readonly _elasticsearchService: ElasticsearchService,
    public readonly userService: UserService,
    public readonly groupService: GroupService,
    public readonly mentionService: MentionService,
    public readonly postService: PostService,
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
      this.postService.bindActorToPost(jsonPosts),
      this.postService.bindAudienceToPost(jsonPosts),
    ]);

    for (const post of jsonPosts) {
      const result = plainToInstance(PostResponseDto, post, {
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
        isArticle: result.isArticle,
      };

      this._logger.log('processing post:', dataIndex.id);

      await this._elasticsearchService
        .index({ index: passedParam[0], id: `${dataIndex.id}`, body: dataIndex })
        .catch((ex) => this._logger.debug(ex));

      this._logger.log('deliver post:', dataIndex.id);
    }
  }
}
