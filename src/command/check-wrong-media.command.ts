import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel } from '../database/models/media.model';
import { ConfigService } from '@nestjs/config';
import { PostModel } from '../database/models/post.model';
import { CommentModel } from '../database/models/comment.model';
import { ExternalService } from '../app/external.service';
import { Op } from 'sequelize';

interface ICommandOptions {
  backupContent: boolean;
}
//npx ts-node -r tsconfig-paths/register src/command/cli.ts check-wrong-media
@Command({ name: 'check-wrong-media', description: 'Move media to Upload service' })
export class CheckWrongMediaCommand implements CommandRunner {
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
      console.info('***** Check wrong media ********');
      console.info('1) Scan posts migrated...');
      console.info('Scanning...');
      await this.processPostMigrated();
      console.info('2) Scan comments migrated ...');
      console.info('Scanning...');
      await this.processCommentMigrated();
    } catch (e) {
      console.log(e);
      throw e;
    }

    process.exit();
  }

  public async processPostMigrated(testId = null): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    const wrongPostIds = [];
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy', 'coverJson', 'mediaJson'],
        where: condition,
        order: [['createdAt', 'desc']],
      });
      const mediaIds = [];
      const mapPostWithMedia = {};
      for (const post of posts) {
        if (post.coverJson?.id && post.coverJson?.url && !mediaIds.includes(post.coverJson?.id)) {
          mediaIds.push(post.coverJson.id);
          mapPostWithMedia[post.coverJson.id] = {
            postId: post.id,
            url: post.coverJson?.url,
            resource: 'cover',
          };
        }

        if (post.mediaJson !== null && post.mediaJson.images?.length > 0) {
          post.mediaJson.images.forEach((item) => {
            if (!mediaIds.includes(item.id)) {
              mediaIds.push(item.id);
              mapPostWithMedia[item.id] = {
                postId: post.id,
                url: item.url,
                resource: 'post:content',
              };
            }
          });
        }
      }

      const imagesFromUpload = await this._externalService.getImageIds(mediaIds);
      imagesFromUpload.forEach((image) => {
        const imageInfo = mapPostWithMedia[image.id] ?? null;
        if (imageInfo && image.url !== imageInfo.url) {
          wrongPostIds.push(imageInfo);
        }
      });
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }

    if (wrongPostIds.length) {
      console.log(`List posts need to fix:`, JSON.stringify(wrongPostIds));
    }
  }

  public async processCommentMigrated(testId = null): Promise<void> {
    const condition = {
      mediaJson: {
        [Op.ne]: null,
      },
    };
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    const wrongCommentIds = [];
    while (!stop) {
      const comments = await this._commentModel.findAll({
        attributes: ['id', 'createdBy', 'mediaJson'],
        where: condition,
        order: [['createdAt', 'desc']],
      });
      const mediaIds = [];
      const mapCommentWithMedia = {};
      for (const comment of comments) {
        if (comment.mediaJson !== null && comment.mediaJson.images?.length > 0) {
          comment.mediaJson.images.forEach((item) => {
            if (!mediaIds.includes(item.id)) {
              mediaIds.push(item.id);
              mapCommentWithMedia[item.id] = {
                commentId: comment.id,
                url: item.url,
                resource: 'post:content',
              };
            }
          });
        }
      }

      const imagesFromUpload = await this._externalService.getImageIds(mediaIds);
      imagesFromUpload.forEach((image) => {
        const imageInfo = mapCommentWithMedia[image.id] ?? null;
        if (imageInfo && image.url !== imageInfo.url) {
          wrongCommentIds.push(imageInfo);
        }
      });
      if (comments.length === 0) stop = true;
      offset = limit + offset;
    }
    if (wrongCommentIds.length) {
      console.log(`List comments need to fix:`, JSON.stringify(wrongCommentIds));
    }
  }
}
