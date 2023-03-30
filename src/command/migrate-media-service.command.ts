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

@Command({ name: 'migrate:media-service', description: 'Move media to Upload service' })
export class MigrateMediaServiceCommand implements CommandRunner {
  public constructor(
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _configService: ConfigService,
    private _externalService: ExternalService,
  ) {
  }

  public async run(): Promise<any> {
    //await this.loopProcess(this.migrateMediaId);
    await this.migrateComments();
    process.exit();
  }

  public async loopProcess(callback) {
    let stop = false;
    let offset = 0;
    const limit = 10;
    while (!stop) {
      const count = await callback(limit, offset);
      console.log('count==', count);
      if (count === 0) stop = true;
      offset = limit + offset;
    }
  }

  public async migrateMediaId(limit = 10, offset = 0): Promise<number> {
    const { schema } = getDatabaseConfig();
    console.log('limit=', limit);
    console.log('offset=', offset);
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
        offsetUUID + identifyChar.length + uuidLength,
      );
      await this._mediaModel.update(
        { id: newId },
        {
          where: { id: image.id },
        },
      );
      console.log(`Changed ID ${image.id} -- to new ID: ${newId}`);
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
      const mediaJson = [];
      const urlImages = ObjectHelper.nodeToUrlImages({ children: JSON.parse(post.content) });

      const availableUrlImages = urlImages
        .filter((item) =>
          item.url.includes(`${s3Config.userSharingAssetsBucket}.s3.${s3Config.region}`),
        )
        .map((image) => {
          const identifyChar = 'post/original/';
          const offsetUUID = image.url.indexOf(identifyChar);
          const uuidLength = 36;
          const newId = image.url.substring(
            offsetUUID + identifyChar.length,
            offsetUUID + identifyChar.length + uuidLength,
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
          }),
        ),
      );

      const replaceImages = dataImages.map((image) => ({
        plateId: image,
        url:,
      }));

      const newContent = ObjectHelper.contentReplaceUrl(post.content, replaceImages);
      this._postModel.update(
        {
          content: newContent,
        },
        {
          where: { id: post.id },
        },
      );
      console.log(`Updated article content: ${post.id}`);
    }
  }

  public async migratePosts(testId = null): Promise<void> {
    const condition = {
      type: PostType.POST,
    };
    if (testId) condition['id'] = testId;
    const posts = await this._postModel.findAll({
      include: [
        {
          model: MediaModel,
          required: true,
        },
      ],
      where: condition,
    });
    for (const post of posts) {
      const imageJson = [];
      const fileJson = [];
      const videoJson = [];
      for (const media of post.media) {
        if (media.type === MediaType.IMAGE) {
          const mediaData = await this._externalService.updateMedia(media.id, {
            userId: post.createdBy,
            type: 'comment',
          });
          imageJson.push({
            id: media.id,
            url: '',
            path: '',
            width: 0,
            height: 0,
          });
        } else if (media.type === MediaType.FILE) {
          fileJson.push({
            id: media.id,
            url: '',
            path: '',
            width: 0,
            height: 0,
          });
        } else {
          videoJson.push({
            id: media.id,
            url: '',
            path: '',
            width: 0,
            height: 0,
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
      console.log(`Updated post ${post.id} - media(${imageJson.length})`);
    }
  }

  public async migratePostsCover(): Promise<void> {
    const posts = await this._postModel.findAll({
      attributes: ['id', 'cover'],
      where: {
        cover: {
          [Op.ne]: null,
        },
      },
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
      console.log(`Updated post cover ${post.id} - media(${mediaJson.length})`);
    }
  }

  public async migrateComments(): Promise<void> {
    const comments = await this._commentModel.findAll({
      include: [
        {
          model: MediaModel,
          required: true,
        },
      ],
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
        },
      );
      console.log(`Updated comment ${comment.id} - media(${mediaJson.length})`);
    }
  }
}
