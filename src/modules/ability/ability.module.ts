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

    // if the user access admin endpoint, his token must have attribute user.staffRole
    if (request.originalUrl.indexOf('/admin/') === 0) {
      if (request.user.staffRole) {
        return await caslAbilityFactory.createForStaff(request.user.staffRole);
      } else {
        // in fact, this exeception never occurs because auth middleware does the check before execute this injection,
        // but for more secure, it is ok
        throw new HttpException('Your staff role is incorrect', HttpStatus.UNAUTHORIZED);
      }
    } else {
      // if users access normal endpoint, treat them as normal users even if they are staff
      request.user = {
        id: request.user.id,
      };
      return await caslAbilityFactory.createForUser(request.user.id);
    }
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
