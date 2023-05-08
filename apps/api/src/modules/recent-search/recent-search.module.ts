import { Module } from '@nestjs/common';
import { RecentSearchService } from './recent-search.service';
import { RecentSearchController } from './recent-search.controller';

@Module({
  imports: [],
  providers: [RecentSearchService],
  controllers: [RecentSearchController],
})
export class RecentSearchModule {}
