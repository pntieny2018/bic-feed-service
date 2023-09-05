import { PostModule } from '../modules/post';
import { Module } from '@nestjs/common';
import { CommentNotificationService } from './services';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { CommentModule } from '../modules/comment';
import {
  CommentActivityService,
  PostActivityService,
  ReactionActivityService,
  ReportActivityService,
  SeriesActivityService,
} from './activities';

@Module({
  imports: [PostModule, CommentModule],
  providers: [
    ReportActivityService,
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
    SeriesActivityService,
  ],

  exports: [
    SeriesActivityService,
    ReportActivityService,
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],
})
export class NotificationModule {}
