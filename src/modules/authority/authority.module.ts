import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { GroupModule } from '../../shared/group';
import { AuthorityController } from './authority.controller';

@Module({
  imports: [GroupModule],
  controllers: [AuthorityController],
  providers: [AuthorityService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
