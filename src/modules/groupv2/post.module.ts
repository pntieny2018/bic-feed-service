import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModule } from '../../shared/group';
import { CreateTagHandler } from './application/command/create-tag/create-tag.handler';
import { DeleteTagHandler } from './application/command/delete-tag/delete-tag.handler';
import { UpdateTagHandler } from './application/command/update-tag/update-tag.handler';
import { TagCreatedEventHandler } from './application/event-handler/tag-created.event-handler';
import { FindTagsPaginationHandler } from './application/query/find/find-tags-pagination.handler';
import { TAG_DOMAIN_SERVICE_TOKEN } from './domain/domain-service/interfaces/tag.domain-service.interface';
import { TagDomainService } from './domain/domain-service/tag.domain-service';
import { TagFactory } from './domain/factory/tag.factory';
import { TAG_REPOSITORY_TOKEN } from './domain/repositoty-interface/group.repository.interface';
import { TagRepository } from './driven-adapter/repository';
import { TagController } from './driving-adapter/controller/tag.controller';

const infrastructure: Provider[] = [
  {
    provide: TAG_REPOSITORY_TOKEN,
    useClass: TagRepository,
  },
  {
    provide: TAG_DOMAIN_SERVICE_TOKEN,
    useClass: TagDomainService,
  },
];

const application = [
  CreateTagHandler,
  UpdateTagHandler,
  DeleteTagHandler,
  FindTagsPaginationHandler,
  TagCreatedEventHandler,
];

const domain = [TagFactory];
@Module({
  imports: [CqrsModule, DatabaseModule, GroupModule],
  controllers: [TagController],
  providers: [...infrastructure, ...application, ...domain],
})
export class PostModuleV2 {}
