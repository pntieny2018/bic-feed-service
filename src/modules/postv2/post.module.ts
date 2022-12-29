import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModule } from '../../shared/group';
import { CreateTagHandler } from './application/command/create-tag/create-tag.handler';
import { DeleteTagHandler } from './application/command/delete-tag/delete-tag.handler';
import { UpdateTagHandler } from './application/command/update-tag/update-tag.handler';
import { TagFactory } from './domain/model/tag/tag.factory';
import { TAG_REPOSITORY } from './domain/repositoty-interface/tag.repository.interface';
import { TagRepository } from './infrastructure/repository/tag.repository';
import { TagController } from './user-interface/controller/tag.controller';

const infrastructure: Provider[] = [
  {
    provide: TAG_REPOSITORY,
    useClass: TagRepository,
  },
];

const application = [CreateTagHandler, UpdateTagHandler, DeleteTagHandler];

const domain = [TagFactory];
@Module({
  imports: [CqrsModule, DatabaseModule, GroupModule],
  controllers: [TagController],
  providers: [...infrastructure, ...application, ...domain],
})
export class PostModuleV2 {}
