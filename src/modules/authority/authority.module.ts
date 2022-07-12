import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { GroupModule } from '../../shared/group';
import { AuthorityController } from './authority.controller';
import { UserModule } from '../../shared/user';

@Module({
  imports: [GroupModule, UserModule],
  controllers: [AuthorityController],
  providers: [AuthorityService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
