import { Module, Global, Scope, HttpException, HttpStatus } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { DatabaseModule } from '../../database';
import { Ability } from '@casl/ability';

const CaslAbility = {
  provide: 'CaslAbility',
  scope: Scope.REQUEST,
  useFactory: async (request, caslAbilityFactory: CaslAbilityFactory) => {
    // because some public endpoints not apply AuthMiddleware
    // we may not get user.id here
    // so we should return empty Ability, it means the request has no permission.
    if (isNaN(request.user.id)) {
      return new Ability();
    }

    request.user = {
      id: request.user.id,
    };
    return await caslAbilityFactory.createForUser(request.user.id);
  },
  inject: [REQUEST, CaslAbilityFactory],
};

@Global()
@Module({
  imports: [],
  providers: [CaslAbilityFactory, CaslAbility],
  exports: [CaslAbility, CaslAbilityFactory],
})
export class AbilityModule {}
