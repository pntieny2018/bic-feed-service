import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { forwardRef, Module } from '@nestjs/common';
import { MentionModule } from '../mention';
import { GroupModule } from '../../shared/group';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { ReactionModule } from '../reaction';
import { ArticleService } from './article.service';
import { PostModule } from '../post';
import { ArticleController } from './article.controller';
import { CategoryModule } from '../category';
import { HashtagModule } from '../hashtag';
import { SeriesModule } from '../series';
@Module({
  imports: [
    PostModule,
    UserModule,
    GroupModule,
    MediaModule,
    MentionModule,
    CategoryModule,
    HashtagModule,
    SeriesModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
