import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { AuthorityFactory } from './authority.factory';
import { GroupModuleV2 } from '../v2-group/group.module';

@Module({
  imports: [GroupModuleV2],
  controllers: [AuthorityController],
  providers: [AuthorityService, AuthorityFactory],
  exports: [AuthorityService],
})
export class AuthorityModule {}
