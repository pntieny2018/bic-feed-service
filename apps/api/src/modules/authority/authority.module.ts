import { GroupModule } from '@libs/service/group';
import { UserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';

import { AuthorityAppService } from './application/authority.app-service';
import { AUTHORITY_APP_SERVICE_TOKEN } from './application/authority.app-service.interface';
import { AuthorityController } from './authority.controller';
import { AuthorityFactory } from './authority.factory';

@Module({
  imports: [GroupModule, UserModule],
  controllers: [AuthorityController],
  providers: [
    AuthorityFactory,
    {
      provide: AUTHORITY_APP_SERVICE_TOKEN,
      useClass: AuthorityAppService,
    },
  ],
  exports: [AUTHORITY_APP_SERVICE_TOKEN],
})
export class AuthorityModule {}
