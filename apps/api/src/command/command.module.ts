import { MigrateHlsMimetypeVideosCommand } from '@api/command/migrate-hls-mimetype-videos.command';
import { MigratePostTitleCommand } from '@api/command/migrate-post-title.command';
import { configs } from '@libs/common/config/configuration';
import { PostgresModule } from '@libs/database/postgres/postgres.module';
import { LogModule } from '@libs/infra/log';
import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { UserModule as LibUserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LibModule } from '../app/lib.module';
import { DatabaseModule } from '../database';
import { FeedPublisherModule, FeedPublisherService } from '../modules/feed-publisher';
import { FollowModule } from '../modules/follow';
import { MediaModule } from '../modules/media';
import { MentionModule } from '../modules/mention';
import { PostModule } from '../modules/post';
import { SearchModule } from '../modules/search';
import { TagModule } from '../modules/tag';

import { CleanUpDeletedCommentRefCommand } from './clean-up-deleted-comment-ref.command';
import { CleanUpDeletedContentRefCommand } from './clean-up-deleted-content-ref.command';
import { CleanUpDeletedContentsCommand } from './clean-up-deleted-content.command';
import { IndexPostCommand } from './elasticsearch-script/index-post.command';
import { ExportInvalidTagNameCommand } from './export-invalid-tag-name.command';
import { ExportReactionCountDataCommand } from './export-reaction-count.command';
import { ExportUserContentDataCommand } from './export-user-content-data.command';
import { FixCommentCountCommand } from './fix-comment-count.command';
import { FixCommentRepliesCountCommand } from './fix-comment-replies-count.command';
import { FixContentPrivacyCommand } from './fix-content-privacy.command';
import { FixPostCommentCountCommand } from './fix-post-comment-count.command';
import { FixProcessingStatusPostCommand } from './fix-processing-status-post.command';
import { FixTotalUsersSeenCommand } from './fix_total_users_seen.command';
import { MigrateArticlesContainErrorImageCommand } from './migrate-articles-contain-error-image.command';
import { MigrateCommentMentionsCommand } from './migrate-comment-mentions.command';
import { MigrateMarkReadImportantPostCommand } from './migrate-mark-read-important-post.command';
import { MigratePostGroupIsHidden } from './migrate-post-group-is-hidden.command';
import { MigratePostMentionsCommand } from './migrate-post-mentions.command';
import { MigratePublishedTimeContentCommand } from './migrate-published-time-content.command';
import { MigrateReportStructure } from './migrate-report-structure.command';
import { MigrateScheduledTimeArticlesCommand } from './migrate-scheduled-time-articles.command';
import { MigrateWordCountCommand } from './migrate-word-count.command';
import { MoveMediaBucketCommand } from './move-media-bucket.command';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { UpdateCommentReactionCountCommand } from './update-comment-reaction-count.command';
import { UpdateContentReactionCountCommand } from './update-content-reaction-count.command';
import { UpdateMediaDomainCommand } from './update-media-domain.command';
import { UpdatePrivacyPostCommand } from './update-post-privacy.command';
import { UpdateTagTotalUsedCommand } from './update-tag-total-used.command';
import { UpdateNewsfeedCommand } from './update-user-newsfeed.command';
import { MigrateNewsfeedCommand } from '@api/command/migrate-newsfeed.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configs],
    }),
    LogModule,
    DatabaseModule,
    LibModule,
    PostModule,
    MentionModule,
    MediaModule,
    SearchModule,
    TagModule,
    FeedPublisherModule,
    FollowModule,
    PostgresModule,
    LibMediaModule,
    LibUserModule,
  ],
  providers: [
    SequelizeTinkerCommand,
    FixCommentCountCommand,
    FixPostCommentCountCommand,
    FixCommentRepliesCountCommand,
    UpdatePrivacyPostCommand,
    UpdateMediaDomainCommand,
    IndexPostCommand,
    MoveMediaBucketCommand,
    UpdateTagTotalUsedCommand,
    // MigrateStatusPostCommand,
    FixProcessingStatusPostCommand,
    UpdateNewsfeedCommand,
    FeedPublisherService,
    FixTotalUsersSeenCommand,
    MigrateCommentMentionsCommand,
    MigratePostMentionsCommand,
    MigrateWordCountCommand,
    MigrateArticlesContainErrorImageCommand,
    MigrateMarkReadImportantPostCommand,
    FixContentPrivacyCommand,
    ExportUserContentDataCommand,
    MigrateScheduledTimeArticlesCommand,
    MigratePublishedTimeContentCommand,
    ExportReactionCountDataCommand,
    ExportInvalidTagNameCommand,
    UpdateCommentReactionCountCommand,
    UpdateContentReactionCountCommand,
    CleanUpDeletedContentRefCommand,
    CleanUpDeletedCommentRefCommand,
    CleanUpDeletedContentsCommand,
    MigratePostGroupIsHidden,
    MigrateReportStructure,
    MigratePostTitleCommand,
    MigrateHlsMimetypeVideosCommand,
    MigrateNewsfeedCommand,
  ],
})
export class CommandModule {}
