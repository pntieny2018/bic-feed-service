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
    //await this.migrateMediaId();
    await this.migratePostsMedia('9f0b1383-4b23-4b8a-9eb4-c1310b6c4d03');
    process.exit();
  }

  public async migrateMediaId(updateOldId = false): Promise<void> {
    const { schema } = getDatabaseConfig();
    await this._mediaModel.sequelize.query(`UPDATE ${schema}.media SET old_id = id`);
    let stop = false;
    let offset = 0;
    const limit = 200;
    let total = 0;
    while (!stop) {
      const images = await this._mediaModel.findAll({
        attributes: ['url', 'id'],
        where: {
          type: MediaType.IMAGE,
        },
        limit,
        offset,
      });
      for (const image of images) {
        const identifyChar = '/original/';
        const offsetUUID = image.url.indexOf(identifyChar);
        const uuidLength = 36;
        const newId = image.url.substring(
          offsetUUID + identifyChar.length,
          offsetUUID + identifyChar.length + uuidLength
        );
        console.log(`Changing ID ${image.id} -- to new ID: ${newId}`);
        await this._mediaModel.update(
          { id: newId },
          {
            where: { id: image.id },
          }
        );
        total++;
      }
      if (images.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all media ID(${total})`);
  }

  public async migrateArticleContent(testId = null): Promise<void> {
    const condition = {
      type: PostType.ARTICLE,
      content: {
        [Op.ne]: null,
      },
    };
    if (testId) condition['id'] = testId;

    let stop = false;
    let offset = 0;
    let total = 0;
    const limit = 200;
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'content'],
        where: condition,
        limit,
        offset,
      });
      const s3Config = this._configService.get<IS3Config>('s3');
      for (const post of posts) {
        total++;
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
        console.log(`Updated article content: ${post.id}`);
      }
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all article content(${total})`);
  }

  /*Media for post*/
  public async migratePostsMedia(testId = null): Promise<void> {
    const condition = {
      type: PostType.POST,
    };
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    let total = 0;
    while (!stop) {
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
          total++;
          if (media.type === MediaType.IMAGE) {
            const mediaData = await this._externalService.updateMedia(media.id, {
              userId: post.createdBy,
              type: 'post:content',
            });
            if (mediaData) {
              imageJson.push({
                id: mediaData.id,
                url: mediaData.url,
                src: mediaData.src,
                width: mediaData.width,
                height: mediaData.height,
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
          }
        );
        console.log(`Updated post media ${post.id} - media(${imageJson.length})`);
      }
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all posts (${total}.`);
  }

  /*Cover for post/article/series*/
  public async migratePostsCover(testId = null): Promise<void> {
    const condition = {
      cover: {
        [Op.ne]: null,
      },
    };
    if (testId) {
      condition['id'] = testId;
    }
    let stop = false;
    let offset = 0;
    let total = 0;
    const limit = 200;
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'cover', 'type'],
        where: condition,
        limit,
        offset,
      });
      for (const post of posts) {
        total++;
        const mediaData = await this._externalService.updateMedia(post.cover, {
          userId: post.createdBy,
          type: `${post.type.toLowerCase()}:cover`,
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
          };
        }
        this._postModel.update(
          {
            coverJson: mediaJson,
          },
          {
            where: { id: post.id },
          }
        );
        console.log(`Updated post cover ${post.id} - media(${mediaJson.length})`);
      }
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all cover(${total})`);
  }

  public async migrateComments(testId = null): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    let total = 0;
    const limit = 200;
    while (!stop) {
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
        total++;
        const mediaJson = [];
        for (const media of comment.media) {
          const mediaData = await this._externalService.updateMedia(media.id, {
            userId: comment.createdBy,
            type: 'comment:content',
          });
          if (mediaData) {
            mediaJson.push({
              id: mediaData.id,
              url: mediaData.url,
              src: mediaData.src,
              width: mediaData.width,
              height: mediaData.height,
              mimeType: mediaData.mimeType,
            });
          }
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
        console.log(`Updated comment ${comment.id} - media(${mediaJson.length})`);
      }
      if (comments.length === 0) stop = true;
      offset = limit + offset;
    }
    console.log(`Migrated all media comments(${total}`);
  }
}
