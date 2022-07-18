import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { AuthorityFactory } from './authority.factory';
import { GroupModule } from '../../shared/group';

@Module({
  imports: [GroupModule],
  controllers: [AuthorityController],
  providers: [AuthorityService, AuthorityFactory],
  exports: [AuthorityService],
})
export class AuthorityModule {}
