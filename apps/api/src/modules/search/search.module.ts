import { GroupModule } from '@libs/service/group';
import { Module, forwardRef } from '@nestjs/common';

import { PostModuleV2 } from '../v2-post/post.module';

import { SearchAppService } from './application/search.app-service';
import { ElasticsearchQueryBuilder } from './elasticsearch-query.builder';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [forwardRef(() => PostModuleV2), GroupModule],
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchQueryBuilder, SearchAppService],
  exports: [SearchService],
})
export class SearchModule {}
