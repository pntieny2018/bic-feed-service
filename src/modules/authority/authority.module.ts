import { Module, Scope } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AuthorityController } from './authority.controller';
import { AuthorityFactory } from './authority.factory';
import { GroupModule } from '../../shared/group';
import { REQUEST } from '@nestjs/core';
import { Ability } from '@casl/ability';

const CaslAbility = {
  provide: 'CaslAbility',
  scope: Scope.REQUEST,
  useFactory: async (request, caslAbilityFactory: AuthorityFactory): Promise<Ability> => {
    return caslAbilityFactory.buildAbility(request.user);
  },
  inject: [REQUEST, AuthorityFactory],
};

@Module({
  imports: [GroupModule],
  controllers: [AuthorityController],
  providers: [AuthorityService, AuthorityFactory, CaslAbility],
  exports: [AuthorityService, CaslAbility],
})
export class AuthorityModule {}
