import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';

@Module({
  providers: [AuthorityService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
