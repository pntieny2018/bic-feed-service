import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel, MediaStatus, MediaType } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { PostModel, PostType } from '../database/models/post.model';
import { CommentModel } from '../database/models/comment.model';
import { getDatabaseConfig } from '../config/database';
import { ExternalService } from '../app/external.service';
import { ObjectHelper } from '../common/helpers';
import { IS3Config } from '../config/s3';
import { Logger } from '@nestjs/common';

interface ICommandOptions {
  backupContent: boolean;
}

//npx ts-node -r tsconfig-paths/register src/command/cli.ts migrate:post-media
// node dist/src/command/cli.js migrate:post-media
@Command({ name: 'migrate:post-media', description: 'Move media to Upload service' })
export class MigratePostMediaCommand implements CommandRunner {
  private _logger = new Logger(MigratePostMediaCommand.name);

  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _configService: ConfigService,
    private _externalService: ExternalService
  ) {}

  @Option({
    flags: '-s, --backup-content [boolean]',
  })
  public parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  public async run(prams, options?: ICommandOptions): Promise<any> {
    try {
      console.info('***** We have 4 steps ********');
      console.info('[Step 1] Migrate media to posts');
      await this.migratePostsMedia(null, options);
      console.info('[Step 2] Migrate cover article/series');
      await this.migratePostsCover(null, options);
      console.info('[Step 3] Migrate image in comments');
      await this.migrateComments(null, options);
      console.info('[Step 4] Migrate images article content');
      await this.migrateArticleContent(null, options);
      console.info('DONE!');
    } catch (e) {
      console.log(e);
      throw e;
    }

    process.exit();
  }

  public getMediaIdFromURL(url): string {
    const matchUUID = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    return matchUUID !== null && matchUUID.length > 0 ? matchUUID[0] : null;
  }

  public parseContentArticle(content) {
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  public async migrateArticleContent(testId = null, options?: ICommandOptions): Promise<void> {
    const condition = {
      type: PostType.ARTICLE,
      content: {
        [Op.ne]: null,
      },
    };
    if (testId) condition['id'] = testId;

    let stop = false;
    let offset = 0;
    let totalUpdated = 0;
    const limit = 200;
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy', 'content'],
        where: condition,
        limit,
        offset,
        order: [['createdAt', 'desc']],
      });
      const s3Config = this._configService.get<IS3Config>('s3');
      for (const post of posts) {
        const articleContent = this.parseContentArticle(post.content);
        if (!articleContent) {
          continue;
        }
        const urlImages = ObjectHelper.nodeToUrlImages({ children: articleContent });
        const bicUrlImages = urlImages
          .filter((item) => item.url.includes(`${s3Config.userSharingAssetsBucket}`))
          .map((image) => {
            const newId = this.getMediaIdFromURL(image.url);
            return {
              id: newId,
              plateId: image.plateId,
              url: image.url,
            };
          });
        if (bicUrlImages.length === 0) {
          continue;
        }
        const dataImages = await Promise.all(
          bicUrlImages.map((image) =>
            this._externalService.updateMedia(image.id, {
              userId: post.createdBy,
              type: 'article:content',
              url: image.url,
              entityId: post.id,
            })
          )
        );
        if (dataImages.length === 0) {
          continue;
        }
        const replaceImages: any = [];

        dataImages.forEach((image) => {
          if (image) {
            replaceImages.push({
              plateId: bicUrlImages.find((item) => item.id === image.originId).plateId,
              url: image.url,
            });
          }
        });
        const newContent = ObjectHelper.contentReplaceUrl(articleContent, replaceImages);

        const { schema } = getDatabaseConfig();
        await this._postModel.sequelize.query(
          `UPDATE ${schema}.posts SET old_content = content, content = :content WHERE id = :postId`,
          {
            replacements: {
              postId: post.id,
              content: JSON.stringify(newContent),
            },
          }
        );
        console.log(`Back up postId: ${post.id}`);
        totalUpdated++;
      }
      console.log(`Updated: ${totalUpdated}`);
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
  }

  /*Media for post only*/
  public async migratePostsMedia(testId = null, options: ICommandOptions): Promise<void> {
    const condition = {
      type: PostType.POST,
    };
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    let totalUpdated = 0;
    while (!stop) {
      const posts = await this._postModel.findAll({
        include: [
          {
            model: MediaModel,
            as: 'media',
            required: true,
            attributes: [
              'id',
              'url',
              'size',
              'extension',
              'type',
              'name',
              'originName',
              'width',
              'height',
              'thumbnails',
              'status',
              'mimeType',
              'createdAt',
            ],
          },
        ],
        where: condition,
        limit,
        offset,
        order: [['createdAt', 'desc']],
      });
      for (const post of posts) {
        const imageJson = [];
        const fileJson = [];
        const videoJson = [];
        for (const media of post.media) {
          if (!media.url) continue;
          if (media.type === MediaType.IMAGE) {
            const mediaData = await this._externalService.updateMedia(media.id, {
              userId: post.createdBy,
              type: 'post:content',
              url: media.url,
              entityId: post.id,
            });
            if (mediaData) {
              imageJson.push({
                id: mediaData.id,
                url: mediaData.url,
                src: mediaData.src,
                mimeType: mediaData.mimeType,
                width: mediaData.width,
                height: mediaData.height,
                resource: mediaData.resource,
              });
            }
          } else if (media.type === MediaType.FILE) {
            fileJson.push({
              id: media.id,
              url: media.url,
              mimeType: media.mimeType,
              name: media.name,
              originName: media.originName,
              size: media.size,
            });
          } else {
            videoJson.push({
              id: media.id,
              url: media.url,
              mimeType: media.mimeType,
              name: media.name,
              originName: media.originName,
              size: media.size,
              width: media.width,
              height: media.height,
              thumbnails: media.thumbnails,
              status: media.status === MediaStatus.COMPLETED ? 'DONE' : 'PROCESSING',
            });
          }
        }
        await this._postModel.update(
          {
            mediaJson: {
              images: imageJson,
              videos: videoJson,
              files: fileJson,
            },
          },
          {
            where: { id: post.id },
          }
        );
        totalUpdated++;
      }
      console.log(`Updated ${totalUpdated}`);
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
  }

  /*Cover for post/article/series*/
  public async migratePostsCover(testId = null, options: ICommandOptions): Promise<void> {
    const condition = {
      cover: {
        [Op.ne]: null,
      },
      type: [PostType.ARTICLE, PostType.SERIES],
    };
    if (testId) {
      condition['id'] = testId;
    }
    let stop = false;
    let offset = 0;
    let totalUpdated = 0;
    const limit = 200;
    const total = await this._postModel.count({
      include: [
        {
          model: MediaModel,
          as: 'coverMedia',
          required: true,
        },
      ],
      where: condition,
    });
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy', 'cover', 'type'],
        include: [
          {
            model: MediaModel,
            as: 'coverMedia',
            required: true,
          },
        ],
        where: condition,
        limit,
        offset,
        order: [['createdAt', 'desc']],
      });
      for (const post of posts) {
        const mediaData = await this._externalService.updateMedia(post.cover, {
          userId: post.createdBy,
          type: `${post.type.toLowerCase()}:cover`,
          url: post.coverMedia.url,
          entityId: post.id,
        });
        let mediaJson = null;
        if (mediaData) {
          mediaJson = {
            id: mediaData.id,
            url: mediaData.url,
            src: mediaData.src,
            width: mediaData.width,
            height: mediaData.height,
            mimeType: mediaData.mimeType,
            resource: mediaData.resource,
          };
        }
        await this._postModel.update(
          {
            coverJson: mediaJson,
          },
          {
            where: { id: post.id },
          }
        );
        totalUpdated++;
      }
      console.log(`Updated: ${totalUpdated}/${total}`);
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
  }

  public async migrateComments(testId = null, options: ICommandOptions): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    let totalUpdated = 0;
    const limit = 200;
    const total = await this._commentModel.count({
      include: [
        {
          model: MediaModel,
          as: 'media',
          required: true,
        },
      ],
      where: condition,
    });
    while (!stop) {
      const comments = await this._commentModel.findAll({
        include: [
          {
            model: MediaModel,
            as: 'media',
            required: true,
          },
        ],
        where: condition,
        limit,
        offset,
        order: [['createdAt', 'desc']],
      });
      for (const comment of comments) {
        const mediaJson = [];
        for (const media of comment['media'] || []) {
          if (!media.url) continue;
          const mediaData = await this._externalService.updateMedia(media.id, {
            userId: comment.createdBy,
            type: 'comment:content',
            url: media.url,
            entityId: comment.id,
          });
          if (mediaData) {
            mediaJson.push({
              id: mediaData.id,
              url: mediaData.url,
              src: mediaData.src,
              width: mediaData.width,
              height: mediaData.height,
              mimeType: mediaData.mimeType,
              resource: mediaData.resource,
            });
          }
        }
        if (mediaJson.length) {
          await this._commentModel.update(
            {
              mediaJson: {
                images: mediaJson,
                videos: [],
                files: [],
              },
            },
            {
              where: { id: comment.id },
            }
          );
          totalUpdated++;
        }
      }
      console.log(`Updated ${totalUpdated}/${total}`);
      if (comments.length === 0) stop = true;
      offset = limit + offset;
    }
  }
}
