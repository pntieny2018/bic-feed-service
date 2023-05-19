import { Module } from '@nestjs/common';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { FixCommentCountCommand } from './fix-comment-count.command';
import { FixPostCommentCountCommand } from './fix-post-comment-count.command';
import { DatabaseModule } from '../database';
import { LibModule } from '../app/lib.module';
import { PostModule } from '../modules/post';
import { UpdatePrivacyPostCommand } from './update-post-privacy.command';
import { MentionModule } from '../modules/mention';
import { MediaModule } from '../modules/media';
import { UpdateMediaDomainCommand } from './update-media-domain.command';
import { CleanArticleCommand } from './clean-article.command';
import { CleanDraftPostCommand } from './clean-draft-posts.command';
import { IndexPostCommand } from './elasticsearch-script/index-post.command';
import { ConfigModule } from '@nestjs/config';
import { configs } from '../config/configuration';
import { MoveMediaBucketCommand } from './move-media-bucket.command';
import { SearchModule } from '../modules/search';
import { TagModule } from '../modules/tag';
import { UpdateTagTotalUsedCommand } from './update-tag-total-used.command';
// import { MigrateStatusPostCommand } from './migrate-status-post.command';
import { FixProcessingStatusPostCommand } from './fix-processing-status-post.command';
import { UpdateNewsfeedCommand } from './update-user-newsfeed.command';
import { FeedPublisherModule, FeedPublisherService } from '../modules/feed-publisher';
import { FollowModule } from '../modules/follow';
import { UpdateContentTypeImageCommand } from './update-content-type-image.command';
import { UploadModule } from '../modules/upload';
import { MultiUpdateVsBulkUpdateCommand } from './test-performance/multi-update-vs-bulk-update.command';
import { FixTotalUsersSeenCommand } from './fix_total_users_seen.command';
import { UserModuleV2 } from '../modules/v2-user/user.module';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { MigrateMediaIdCommand } from './migrate-media-id.command';
import { MigratePostMediaCommand } from './migrate-post-media.command';
import { CheckWrongMediaCommand } from './check-wrong-media.command';
import { MigrateLinkPreviewCommand } from './migrate-link-preview.command';
import { MigrateCommentMentionsCommand } from './migrate-comment-mentions.command';
import { MigratePostMentionsCommand } from './migrate-post-mentions.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    DatabaseModule,
    LibModule,
    UserModuleV2,
    GroupModuleV2,
    PostModule,
    MentionModule,
    MediaModule,
    SearchModule,
    TagModule,
    FeedPublisherModule,
    FollowModule,
    UploadModule,
  ],
  providers: [
    SequelizeTinkerCommand,
    FixCommentCountCommand,
    FixPostCommentCountCommand,
    UpdatePrivacyPostCommand,
    UpdateMediaDomainCommand,
    CleanArticleCommand,
    CleanDraftPostCommand,
    IndexPostCommand,
    MoveMediaBucketCommand,
    UpdateTagTotalUsedCommand,
    // MigrateStatusPostCommand,
    FixProcessingStatusPostCommand,
    UpdateNewsfeedCommand,
    FeedPublisherService,
    UpdateContentTypeImageCommand,
    MultiUpdateVsBulkUpdateCommand,
    FixTotalUsersSeenCommand,
    MigrateMediaIdCommand,
    MigratePostMediaCommand,
    CheckWrongMediaCommand,
    MigrateLinkPreviewCommand,
    MigrateCommentMentionsCommand,
    MigratePostMentionsCommand,
  ],
})
export class CommandModule {}
