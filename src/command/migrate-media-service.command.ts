import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel, MediaType } from '../database/models/media.model';
import { Op } from 'sequelize';
import { ConfigService } from '@nestjs/config';
import { PostModel, PostType } from '../database/models/post.model';
import { CommentModel } from '../database/models/comment.model';
import { getDatabaseConfig } from '../config/database';
import { ExternalService } from '../app/external.service';
import { ObjectHelper } from '../common/helpers';
import { IS3Config } from '../config/s3';
import { Logger } from '@nestjs/common';

@Command({ name: 'migrate:media-service', description: 'Move media to Upload service' })
export class MigrateMediaServiceCommand implements CommandRunner {
  private _logger = new Logger(MigrateMediaServiceCommand.name);

  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _configService: ConfigService,
    private _externalService: ExternalService
  ) {}

  public async run(): Promise<any> {
    //await this.loopProcess(this.migrateMediaId);
    let stop = false;
    let offset = 0;
    const limit = 10;
    while (!stop) {
      const count = await this.migratePostsMedia(
        limit,
        offset,
        '67341906-7325-4711-913c-0fb8cd52b5d9'
      );
      this._logger.debug('count==', count);
      if (count === 0) stop = true;
      offset = limit + offset;
    }

    //await this.migrateComments();
    process.exit();
  }

  public async migrateMediaId(limit = 10, offset = 0): Promise<number> {
    const { schema } = getDatabaseConfig();
    await this._mediaModel.sequelize.query(`UPDATE ${schema}.media SET old_id = id`);
    const images = await this._mediaModel.findAll({
      attributes: ['url', 'id'],
      where: {
        type: MediaType.IMAGE,
      },
      limit,
      offset,
    });

    for (const image of images) {
      const identifyChar = 'images/original/';
      const offsetUUID = image.url.indexOf(identifyChar);
      const uuidLength = 36;
      const newId = image.url.substring(
        offsetUUID + identifyChar.length,
        offsetUUID + identifyChar.length + uuidLength
      );
      await this._mediaModel.update(
        { id: newId },
        {
          where: { id: image.id },
        }
      );
      this._logger.debug(`Changed ID ${image.id} -- to new ID: ${newId}`);
    }

    return images.length;
  }

  public async migrateArticleContent(testId = null): Promise<void> {
    const condition = {
      type: PostType.ARTICLE,
      content: {
        [Op.ne]: null,
      },
    };
    if (testId) condition['id'] = testId;
    const posts = await this._postModel.findAll({
      attributes: ['id', 'content'],
      where: condition,
    });
    const s3Config = this._configService.get<IS3Config>('s3');
    for (const post of posts) {
      const urlImages = ObjectHelper.nodeToUrlImages({ children: JSON.parse(post.content) });

      const availableUrlImages = urlImages
        .filter((item) =>
          item.url.includes(`${s3Config.userSharingAssetsBucket}.s3.${s3Config.region}`)
        )
        .map((image) => {
          const identifyChar = 'post/original/';
          const offsetUUID = image.url.indexOf(identifyChar);
          const uuidLength = 36;
          const newId = image.url.substring(
            offsetUUID + identifyChar.length,
            offsetUUID + identifyChar.length + uuidLength
          );
          return {
            id: newId,
            plateId: image.plateId,
          };
        });
      const dataImages = await Promise.all(
        availableUrlImages.map((image) =>
          this._externalService.updateMedia(image.id, {
            userId: post.createdBy,
            type: 'comment',
          })
        )
      );

      const replaceImages = dataImages.map((image) => ({
        plateId: availableUrlImages.find((item) => item.id === image.id).plateId,
        url: image.url,
      }));

      const newContent = ObjectHelper.contentReplaceUrl(post.content, replaceImages);
      this._postModel.update(
        {
          content: newContent,
        },
        {
          where: { id: post.id },
        }
      );
      this._logger.debug(`Updated article content: ${post.id}`);
    }
  }

  public async migratePostsMedia(limit = 10, offset = 0, testId = null): Promise<number> {
    const condition = {
      type: PostType.POST,
    };
    if (testId) condition['id'] = testId;
    console.log('xxxxxxxxxxxxxxxx');
    const posts = await this._postModel.findAll({
      include: [
        {
          model: MediaModel,
          as: 'media',
          required: false,
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
    });
    for (const post of posts) {
      const imageJson = [];
      const fileJson = [];
      const videoJson = [];
      for (const media of post.media) {
        if (media.type === MediaType.IMAGE) {
          // const mediaData = await this._externalService.updateMedia(media.id, {
          //   userId: post.createdBy,
          //   type: 'comment',
          // });
          // imageJson.push({
          //   id: media.id,
          //   url: '',
          //   path: '',
          //   width: 0,
          //   height: 0,
          // });
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
          });
        }
      }
      this._postModel.update(
        {
          mediaJson: {
            images: imageJson,
            videos: videoJson,
            files: fileJson,
          },
        },
        {
          where: { id: post.id },
        },
      );
      this._logger.debug(`Updated post ${post.id} - media(${imageJson.length})`);
    }
    return posts.length;
  }

  public async migratePostsCover(limit = 10, offset = 0, testId = null): Promise<void> {
    const condition = {
      cover: {
        [Op.ne]: null,
      },
    };
    if (testId) {
      condition['id'] = testId;
    }
    const posts = await this._postModel.findAll({
      attributes: ['id', 'cover'],
      where: condition,
      limit,
      offset,
    });
    for (const post of posts) {
      const mediaJson = [];
      const mediaData = await this._externalService.updateMedia(post.cover, {
        userId: post.createdBy,
        type: 'comment',
      });
      mediaJson.push({
        id: post.id,
        url: '',
        path: '',
        width: 0,
        height: 0,
      });
      this._postModel.update(
        {
          coverJson: {
            images: mediaJson,
            videos: [],
            files: [],
          },
        },
        {
          where: { id: post.id },
        },
      );
      this._logger.debug(`Updated post cover ${post.id} - media(${mediaJson.length})`);
    }
  }

  public async migrateComments(limit = 10, offset = 0, testId = null): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;
    const comments = await this._commentModel.findAll({
      include: [
        {
          model: MediaModel,
          required: true,
        },
      ],
      where: condition,
    });
    for (const comment of comments) {
      const mediaJson = [];
      for (const media of comment.media) {
        const mediaData = await this._externalService.updateMedia(media.id, {
          userId: comment.createdBy,
          type: 'comment',
        });
        mediaJson.push({
          id: media.id,
          url: '',
          path: '',
          width: 0,
          height: 0,
        });
      }
      this._commentModel.update(
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
      this._logger.debug(`Updated comment ${comment.id} - media(${mediaJson.length})`);
    }
  }
}
