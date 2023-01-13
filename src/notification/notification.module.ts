import { PostModule } from '../modules/post';
import { forwardRef, Module } from '@nestjs/common';
import { CommentNotificationService } from './services';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { CommentModule } from '../modules/comment';
import { ReportActivityService, SeriesActivityService } from './activities';
import { CommentActivityService, PostActivityService, ReactionActivityService } from './activities';

@Module({
  imports: [forwardRef(() => PostModule), forwardRef(() => CommentModule)],
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
