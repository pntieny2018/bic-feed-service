import { Module } from '@nestjs/common';
import { RecentSearchService } from './recent-search.service';

@Module({
  imports: [],
  providers: [RecentSearchService],
  controllers: [],
})
export class RecentSearchModule {}
