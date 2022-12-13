import { PostModule } from '../modules/post';
import { forwardRef, Module } from '@nestjs/common';
import { CommentNotificationService } from './services';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { CommentModule } from '../modules/comment';
import { ReportActivityService } from './activities/report-activity.service';
import { CommentActivityService, PostActivityService, ReactionActivityService } from './activities';

@Module({
  imports: [forwardRef(() => PostModule), forwardRef(() => CommentModule)],
  providers: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],

  exports: [
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
