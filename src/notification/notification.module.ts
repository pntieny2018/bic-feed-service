import { forwardRef, Module } from '@nestjs/common';
import { PostModule } from '../modules/post';
import { CommentNotificationService } from './services';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { CommentActivityService, PostActivityService, ReactionActivityService } from './activities';

@Module({
  imports: [forwardRef(() => PostModule)],
  providers: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],

  exports: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],
})
export class NotificationModule {}
