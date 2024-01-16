import { CONTENT_STATUS } from '@beincom/constants';
import {
  FailedProcessPostModel,
  PostModel,
  UserNewsFeedModel,
} from '@libs/database/postgres/model';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import moment from 'moment';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  CACHE_CONTENT_REPOSITORY_TOKEN,
  ICacheContentRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class PostCronService {
  private _logger = new Logger(PostCronService.name);

  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(FailedProcessPostModel)
    private readonly _failedProcessPostModel: typeof FailedProcessPostModel,
    @Inject(CACHE_CONTENT_REPOSITORY_TOKEN)
    private readonly _contentCacheRepo: ICacheContentRepository,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize
  ) {}

  /* Delete posts that had been deleted after 30 days*/
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanDeletedPost(): Promise<void> {
    this._logger.debug('[Cron Job] Start clean deteted post');
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
      this._logger.debug('[Cron Job] Complete clean deteted post');
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      await transaction.rollback();
    }
  }
  @Cron(CronExpression.EVERY_30_MINUTES)
  private async _jobUpdateImportantPost(): Promise<void> {
    try {
      this._logger.debug('[Cron Job] Start update important post');
      const importantPosts = await this._postModel.findAll({
        where: {
          isImportant: true,
          importantExpiredAt: {
            [Op.lt]: Sequelize.literal('NOW()'),
          },
        },
      });

      const importantPostIds = importantPosts.map((post) => post.id);

      await this._postModel.update(
        {
          isImportant: false,
        },
        {
          where: {
            id: importantPostIds,
          },
          paranoid: false,
        }
      );

      await this._sequelizeConnection.query(
        `UPDATE ${UserNewsFeedModel.getTableName()} 
        SET is_important = false WHERE post_id IN 
        (
          SELECT id FROM ${PostModel.getTableName()} 
          WHERE is_important = true AND important_expired_at < NOW()
        )`
      );

      await this._contentCacheRepo.deleteContents(importantPostIds);

      this._logger.debug('[Cron Job] Complete update important post');
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _checkProcessingPost(): Promise<void> {
    try {
      this._logger.debug('[Cron Job] Start check processing post');
      const posts = await this._postModel.findAll({
        where: {
          status: CONTENT_STATUS.PROCESSING,
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
      this._logger.debug('[Cron Job] Complete check processing post');
    } catch (e) {
      this._logger.error(e.message);
    }
  }
}
