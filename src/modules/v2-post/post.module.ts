import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { tagProvider } from './provider';
import { UserModuleV2 } from '../v2-user/user.module';

@Module({
  imports: [CqrsModule, DatabaseModule, GroupModuleV2, UserModuleV2],
  controllers: [TagController],
  providers: [...tagProvider],
})
export class PostModuleV2 {}
