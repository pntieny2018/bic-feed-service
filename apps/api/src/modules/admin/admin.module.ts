import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PostModule } from '../post';
import { ArticleModule } from '../article';
import { SeriesModule } from '../series';

@Module({
  imports: [PostModule, ArticleModule, SeriesModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
