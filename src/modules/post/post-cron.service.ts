import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import moment from 'moment';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { SentryService } from '../../../libs/sentry/src';
import { ArrayHelper } from '../../common/helpers';
import { MediaMarkAction, MediaModel } from '../../database/models/media.model';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { PostModel } from '../../database/models/post.model';
import { MediaService } from '../media';
import { PostService } from './post.service';
@Injectable()
export class PostCronService {
  private _logger = new Logger(PostCronService.name);

  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectModel(PostEditedHistoryModel)
    private readonly _postModel: typeof PostModel,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _mediaService: MediaService,
    private readonly _sentryService: SentryService,
    private readonly _postService: PostService
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async _cleanDeletedPost(): Promise<void> {
    const willDeletePosts = await this._postModel.findAll({
      where: {
        deletedAt: {
          [Op.lte]: moment().subtract(30, 'days').toDate(),
        },
      },
      paranoid: false,
      include: {
        model: MediaModel,
        through: {
          attributes: [],
        },
        attributes: ['id', 'type'],
        required: false,
      },
    });
    if (willDeletePosts.length) {
      const mediaList = ArrayHelper.arrayUnique(
        willDeletePosts.filter((e) => e.media.length).map((e) => e.media)
      );
      if (!(await this._mediaService.isExistOnPostOrComment(mediaList.map((e) => e.id)))) {
        this._mediaService.emitMediaToUploadServiceFromMediaList(mediaList, MediaMarkAction.DELETE);
      }
      const transaction = await this._sequelizeConnection.transaction();

      try {
        for (const post of willDeletePosts) {
          await this._postService.cleanRelationship(post.id, transaction, true);
          await post.destroy({ force: true, transaction });
        }
        await transaction.commit();
      } catch (e) {
        this._logger.error(e.message);
        this._sentryService.captureException(e);
        await transaction.rollback();
      }
    }
  }
  @Cron(CronExpression.EVERY_MINUTE)
  private async _jobUpdateImportantPost(): Promise<void> {
    console.log('cronnnnnnn==================');
    try {
      this._postModel.update(
        {
          isImportant: false,
          importantExpiredAt: null,
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
      this._logger.error(e.message);
      this._sentryService.captureException(e);
    }
  }
}
