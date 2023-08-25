import { SentryService } from '@libs/infra/sentry';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import moment from 'moment';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { FailedProcessPostModel } from '../../database/models/failed-process-post.model';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { MediaService } from '../media';

import { PostService } from './post.service';

@Injectable()
export class PostCronService {
  private _logger = new Logger(PostCronService.name);

  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(FailedProcessPostModel)
    private readonly _failedProcessPostModel: typeof FailedProcessPostModel,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _mediaService: MediaService,
    private readonly _sentryService: SentryService,
    private readonly _postService: PostService
  ) {}

  /* Delete posts that had been deleted after 30 days*/
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanDeletedPost(): Promise<void> {
    const willDeletePosts = await this._postModel.findAll({
      where: {
        deletedAt: {
          [Op.lte]: moment().subtract(30, 'days').toDate(),
        },
      },
      paranoid: false,
    });
    if (willDeletePosts.length === 0) {
      return;
    }

    const transaction = await this._sequelizeConnection.transaction();

    try {
      for (const post of willDeletePosts) {
        await post.destroy({ force: true, transaction });
      }
      await transaction.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
      await transaction.rollback();
    }
  }
  @Cron(CronExpression.EVERY_MINUTE)
  private async _jobUpdateImportantPost(): Promise<void> {
    try {
      await this._postModel.update(
        {
          isImportant: false,
        },
        {
          where: {
            isImportant: true,
            importantExpiredAt: {
              [Op.lt]: Sequelize.literal('NOW()'),
            },
          },
          paranoid: false,
        }
      );
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _checkProcessingPost(): Promise<void> {
    try {
      const posts = await this._postModel.findAll({
        where: {
          status: PostStatus.PROCESSING,
          updatedAt: {
            [Op.lt]: moment().subtract(1, 'day').toDate(),
          },
        },
        include: [
          {
            model: FailedProcessPostModel,
            attributes: ['is_expired_processing'],
            required: false,
          },
        ],
      });

      await this._failedProcessPostModel.bulkCreate(
        posts
          .filter((post) => post.failedPostReasons.every((r) => !r.isExpiredProcessing))
          .map((item) => ({
            postId: item.id,
            isExpiredProcessing: true,
            reason: 'Processing expired',
            postJson: JSON.stringify(item),
          })),
        {
          updateOnDuplicate: [],
        }
      );
    } catch (e) {
      this._logger.error(e.message);
      this._sentryService.captureException(e);
    }
  }
}
