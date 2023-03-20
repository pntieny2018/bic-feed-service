import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ClassTransformer } from 'class-transformer';
import { SentryService } from '@app/sentry';
import { ReactionService } from '../reaction';
import { MentionService } from '../mention';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { PostBindingService } from '../post/post-binding.service';
import { ArticleResponseDto } from './dto/responses';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../v2-group/application';

@Injectable()
export class ArticleBindingService extends PostBindingService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(ArticleBindingService.name);

  /**
   *  ClassTransformer
   * @protected
   */
  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    protected sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    @Inject(USER_APPLICATION_TOKEN)
    protected userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected groupAppService: IGroupApplicationService,
    @Inject(forwardRef(() => ReactionService))
    protected reactionService: ReactionService,
    protected mentionService: MentionService,
    protected linkPreviewService: LinkPreviewService,
    protected readonly sentryService: SentryService
  ) {
    super(
      sequelizeConnection,
      postModel,
      userAppService,
      groupAppService,
      reactionService,
      mentionService,
      linkPreviewService,
      sentryService
    );
  }

  /**
   * Bind Audience To Post.Groups
   */

  public async bindRelatedData(
    posts: any[],
    options?: {
      shouldBindActor?: boolean;
      shouldBindMention?: boolean;
      shouldBindAudience?: boolean;
      shouldBindReaction?: boolean;
      shouldHideSecretAudienceCanNotAccess?: boolean;
      authUser?: UserDto;
    }
  ): Promise<ArticleResponseDto[]> {
    const processList = [];
    if (options?.shouldBindActor) {
      processList.push(this.bindActor(posts));
    }
    if (options?.shouldBindMention) {
      processList.push(this.mentionService.bindToPosts(posts));
    }
    if (options?.shouldBindAudience) {
      processList.push(
        this.bindAudience(posts, {
          shouldHideSecretAudienceCanNotAccess:
            options?.shouldHideSecretAudienceCanNotAccess ?? false,
          authUser: options?.authUser ?? null,
        })
      );
    }
    if (options?.shouldBindReaction) {
      processList.push(this.reactionService.bindToPosts(posts));
    }
    if (processList.length === 0) return [];
    await Promise.all(processList);
    return posts;
  }
}
