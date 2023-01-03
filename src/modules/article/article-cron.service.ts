import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClassTransformer } from 'class-transformer';
import { ArticleAppService } from './application/article.app-service';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { Op } from 'sequelize';
import moment from 'moment/moment';
import { ArticleService } from './article.service';

@Injectable()
export class ArticleCronService {
  private _logger = new Logger(ArticleCronService.name);

  protected classTransformer = new ClassTransformer();

  public constructor(
    private _articleAppService: ArticleAppService,
    private _articleService: ArticleService,
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  private async _jobSchedulePublishArticle(): Promise<void> {
    try {
      const articles = await this._postModel.findAll({
        where: {
          status: PostStatus.WAITING_SCHEDULE,
          publishedAt: { [Op.lte]: moment().toDate() },
        },
      });
      for (const article of articles) {
        try {
          await this._articleAppService.publish(article.errorLog, article.id);
        } catch (e) {
          await this._articleService.updateArticleStatusAndLog(
            article.id,
            PostStatus.SCHEDULE_FAILED,
            { message: e.message, data: article }
          );
        }
      }
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }
}
