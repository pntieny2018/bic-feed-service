import { Module } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { AuthorityFactory } from './authority.factory';
import { GroupModuleV2 } from '../v2-group/group.module';
import { AUTHORITY_APP_SERVICE_TOKEN } from './application/authority.app-service.interface';
import { AuthorityAppService } from './application/authority.app-service';

@Module({
  imports: [GroupModuleV2],
  controllers: [AuthorityController],
  providers: [
    AuthorityService,
    AuthorityFactory,
    {
      provide: AUTHORITY_APP_SERVICE_TOKEN,
      useClass: AuthorityAppService,
    },
  ],
  exports: [AuthorityService, AUTHORITY_APP_SERVICE_TOKEN],
})
export class AuthorityModule {}
