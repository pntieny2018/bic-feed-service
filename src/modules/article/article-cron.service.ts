import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClassTransformer } from 'class-transformer';
import { ArticleAppService } from './application/article.app-service';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { Op } from 'sequelize';
import moment from 'moment/moment';
import { ArticleService } from './article.service';
import { UserService } from '../../shared/user';
import { UserDto } from '../auth';

@Injectable()
export class ArticleCronService {
  private _logger = new Logger(ArticleCronService.name);

  public constructor(
    private _articleAppService: ArticleAppService,
    private _articleService: ArticleService,
    private _userService: UserService,
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
          const userProfile = await this._userService.get(article.createdBy);
          const userPermission = await this._userService.getPermissions(
            userProfile.id,
            JSON.stringify({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              'cognito:username': userProfile.username,
            })
          );
          const userDTO: UserDto = {
            id: userProfile.id,
            profile: userProfile,
            permissions: userPermission,
          };
          await this._articleAppService.publish(userDTO, article.id, true);
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
