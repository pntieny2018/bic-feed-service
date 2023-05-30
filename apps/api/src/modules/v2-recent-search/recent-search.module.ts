import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RecentSearchController } from './driving-adapter/controller/recent-search.controller';
import { recentSearchProvider } from './provider/recent-search.provider';

@Module({
  imports: [CqrsModule],
  controllers: [RecentSearchController],
  providers: [...recentSearchProvider],
})
export class RecentSearchModuleV2 {}
