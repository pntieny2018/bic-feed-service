import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { GroupModule } from '../../shared/group';

@Module({
  imports: [GroupModule],
  providers: [AuthorityService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
