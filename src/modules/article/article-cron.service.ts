import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArticleAppService } from './application/article.app-service';
import { InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel, PostStatus } from '../../database/models/post.model';
import { Op, WhereOptions } from 'sequelize';
import moment from 'moment/moment';
import { ArticleService } from './article.service';
import { UserService } from '../../shared/user';
import { UserDto } from '../auth';
import { RedisService } from '@app/redis';

@Injectable()
export class ArticleCronService {
  private _logger = new Logger(ArticleCronService.name);

  public constructor(
    private _articleAppService: ArticleAppService,
    private _articleService: ArticleService,
    private _userService: UserService,
    private _redisService: RedisService,
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  private async _getsRecursive(
    conditions: WhereOptions,
    _limit = 1000,
    _offset = 0,
    _posts: IPost[] = [],
    _lastResultLength = 0
  ): Promise<IPost[]> {
    if (_offset > 0 && _lastResultLength < _limit) return _posts;
    const posts = await this._postModel.findAll({
      where: conditions,
      limit: _limit,
      offset: _offset,
    });
    // console.log('posts: ', posts.map(e=>e.id))
    return this._getsRecursive(
      conditions,
      _limit,
      _offset + _limit,
      _posts.concat(posts),
      posts.length
    );
  }

  @Cron('33 */30 * * * *')
  private async _jobSchedulePublishArticle(): Promise<void> {
    try {
      const isRunningArticleSchedule = await this._redisService.setNxEx(
        'isRunningArticleSchedule',
        true
      );
      if (isRunningArticleSchedule === 1) {
        const articles = await this._getsRecursive({
          status: PostStatus.WAITING_SCHEDULE,
          publishedAt: { [Op.lte]: moment().toDate() },
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
      }
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }
}
