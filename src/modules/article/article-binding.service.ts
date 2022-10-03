import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { ClassTransformer } from 'class-transformer';
import { SentryService } from '@app/sentry';
import { UserDto } from '../auth';
import { ReactionService } from '../reaction';
import { MentionService } from '../mention';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { PostBindingService } from '../post/post-binding.service';
import { ArticleResponseDto } from './dto/responses';

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
    protected userService: UserService,
    protected groupService: GroupService,
    @Inject(forwardRef(() => ReactionService))
    protected reactionService: ReactionService,
    protected mentionService: MentionService,
    protected linkPreviewService: LinkPreviewService,
    protected readonly sentryService: SentryService
  ) {
    super(
      sequelizeConnection,
      postModel,
      userService,
      groupService,
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
      shouldBindLinkPreview?: boolean;
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
    if (options?.shouldBindLinkPreview) {
      processList.push(this.linkPreviewService.bindToPosts(posts));
    }
    if (processList.length === 0) return [];
    await Promise.all(processList);
    return this.transform(posts);
  }

  protected transform(posts: any[]): ArticleResponseDto[] {
    return this.classTransformer.plainToInstance(ArticleResponseDto, posts, {
      excludeExtraneousValues: true,
    });
  }
}
