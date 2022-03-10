import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { RecentSearchService } from './recent-search.service';
import { RecentSearchController } from './recent-search.controller';

@Module({
  imports: [DatabaseModule],
  providers: [RecentSearchService],
  controllers: [RecentSearchController],
})
export class RecentSearchModule {}
