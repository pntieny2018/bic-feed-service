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
      console.info('Posts...');
      console.info('Scanning...');
      await this.process();
      console.info('Comments...');
      console.info('Scanning...');
      await this.processComment();
    } catch (e) {
      console.log(e);
      throw e;
    }

    process.exit();
  }

  public async process(testId = null): Promise<void> {
    const condition = {};
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    let totalUpdated = 0;
    while (!stop) {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy', 'coverJson', 'mediaJson'],
        where: condition,
        order: [['createdAt', 'desc']],
      });

      for (const post of posts) {
        const dataUpdate = {
          coverJson: post.coverJson,
          mediaJson: post.mediaJson,
        };

        let needUpdate = false;
        if (post.coverJson?.id && post.coverJson?.url) {
          const coverData = await this._externalService.getImageIds([post.coverJson.id]);
          if (coverData.length > 0 && coverData[0].url !== post.coverJson?.url) {
            console.error(`Cover image not found, ${JSON.stringify(post.coverJson)}`);
            dataUpdate.coverJson = coverData[0];
            needUpdate = true;
          }
        }

        if (post.mediaJson !== null && post.mediaJson.images?.length > 0) {
          const imageIds = post.mediaJson.images.map((image) => image.id);
          const uploadImages = await this._externalService.getImageIds(imageIds);
          const imageErrors = [];
          const newImages = [];
          for (const image of post.mediaJson.images) {
            const findImageInPost = uploadImages.find((img) => img.id === image.id);
            if (findImageInPost && findImageInPost.url !== image.url) {
              imageErrors.push(image.url);

              //clone image
              newImages.push();
            } else {
              newImages.push(image);
            }
          }
          if (imageErrors.length) {
            console.error(`Post image not found, ${JSON.stringify(imageErrors)}`);
            dataUpdate.mediaJson = {
              files: [],
              videos: [],
              images: newImages,
            };
            needUpdate = true;
          }
        }

        if (needUpdate) {
          totalUpdated++;
          // await this._postModel.update(dataUpdate, {
          //   where: {
          //     id: post.id,
          //   },
          // });
          console.log(`${totalUpdated}. Updated image for postID: ${post.id}`);
          console.log(`---------------------------------------------------------------`);
        }
      }
      if (posts.length === 0) stop = true;
      offset = limit + offset;
    }
  }

  public async processComment(testId = null): Promise<void> {
    const condition = {
      mediaJson: {
        [Op.ne]: null,
      },
    };
    if (testId) condition['id'] = testId;
    let stop = false;
    let offset = 0;
    const limit = 200;
    let totalUpdated = 0;
    while (!stop) {
      const comments = await this._commentModel.findAll({
        attributes: ['id', 'createdBy', 'mediaJson'],
        where: condition,
        order: [['createdAt', 'desc']],
      });

      for (const comment of comments) {
        const dataUpdate = {
          mediaJson: comment.mediaJson,
        };

        let needUpdate = false;

        if (comment.mediaJson !== null && comment.mediaJson.images?.length > 0) {
          const imageIds = comment.mediaJson.images.map((image) => image.id);
          const uploadImages = await this._externalService.getImageIds(imageIds);
          const imageErrors = [];
          const newImages = [];
          for (const image of comment.mediaJson.images) {
            const findImageInPost = uploadImages.find((img) => img.id === image.id);
            if (findImageInPost && findImageInPost.url !== image.url) {
              imageErrors.push(image.url);

              //clone image
              newImages.push();
            } else {
              newImages.push(image);
            }
          }
          if (imageErrors.length) {
            console.error(`Post image not found, ${JSON.stringify(imageErrors)}`);
            dataUpdate.mediaJson = {
              files: [],
              videos: [],
              images: newImages,
            };
            needUpdate = true;
          }
        }

        if (needUpdate) {
          totalUpdated++;
          // await this._postModel.update(dataUpdate, {
          //   where: {
          //     id: post.id,
          //   },
          // });
          console.log(`${totalUpdated}. Updated image for commentID: ${comment.id}`);
          console.log(`---------------------------------------------------------------`);
        }
      }
      if (comments.length === 0) stop = true;
      offset = limit + offset;
    }
  }
}
