import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { CreateTagHandler } from './application/command/create-tag/create-tag.handler';
import { DeleteTagHandler } from './application/command/delete-tag/delete-tag.handler';
import { UpdateTagHandler } from './application/command/update-tag/update-tag.handler';
import { FindTagsPaginationHandler } from './application/query/find-tags/find-tags-pagination.handler';
import { TAG_DOMAIN_SERVICE_TOKEN } from './domain/domain-service/interface/tag.domain-service.interface';
import { TagDomainService } from './domain/domain-service/tag.domain-service';
import { TagFactory } from './domain/factory/tag.factory';
import { TAG_QUERY_TOKEN } from './domain/query-interface';
import { TAG_REPOSITORY_TOKEN } from './domain/repositoty-interface/tag.repository.interface';
import { TagQuery } from './driven-adapter/query';
import { TagRepository } from './driven-adapter/repository';
import { TagController } from './driving-apdater/controller/tag.controller';

const infrastructure: Provider[] = [
  {
    provide: TAG_REPOSITORY_TOKEN,
    useClass: TagRepository,
  },
  {
    provide: TAG_DOMAIN_SERVICE_TOKEN,
    useClass: TagDomainService,
  },
  {
    provide: TAG_QUERY_TOKEN,
    useClass: TagQuery,
  },
];

const application = [
  CreateTagHandler,
  UpdateTagHandler,
  DeleteTagHandler,
  FindTagsPaginationHandler,
];

const domain = [TagFactory];
@Module({
  imports: [CqrsModule, DatabaseModule, GroupModuleV2],
  controllers: [TagController],
  providers: [...infrastructure, ...application, ...domain],
})
export class PostModuleV2 {}
