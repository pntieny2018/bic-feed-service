import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Ability} from '@casl/ability';
import { RedisService } from '@app/redis';
import { SentryService } from '@app/sentry';
import { CACHE_KEYS } from './actions';
@Injectable()
export class CaslAbilityFactory {
  public constructor(private _store: RedisService, private _sentryService: SentryService) {}

  public async createForUser(userId: number) {
    try {
      // get all permission of the user
      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
      const cachedPermissions = await this._store.get(cacheKey);
      if (cachedPermissions) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return new Ability(cachedPermissions);
      } else return new Ability();
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException(ex);
    }
  }
}
