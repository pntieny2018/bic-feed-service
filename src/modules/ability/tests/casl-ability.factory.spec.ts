import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { Ability, subject } from '@casl/ability';
import { RedisService } from '../../../../libs/redis/src';
import { SentryService } from '../../../../libs/sentry/src';
import { CACHE_KEYS } from '../../../common/constants/casl.constant';
import { InternalServerErrorException } from '@nestjs/common';

const sentryServiceMock = {
  captureException: jest.fn(),
};
let redisCacheService;
let caslAbilityFactory: CaslAbilityFactory;

describe('casl-ability.factory', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
          }
        },
        { provide: SentryService, useValue: sentryServiceMock },
      ],
    }).compile();

    redisCacheService = module.get<RedisService>(RedisService);
    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Function - createForUser', () => {

    it('should get abilities from cache if exist', async () => {
      const userId = 1;
      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
      const cachedAbilities = [];

      redisCacheService.get.mockResolvedValue(cachedAbilities);

      CaslAbilityFactory.extractAbilitiesFromPermission = jest
        .fn()
        .mockReturnValue([]);
      const result = await caslAbilityFactory.createForUser(userId);

      expect(result).toStrictEqual(new Ability([]));
      expect(redisCacheService.get).toBeCalledWith(cacheKey);
      expect(redisCacheService.set).not.toBeCalled();
    });

    it('should handle error when getting cache and throw internal error', async () => {
      const userId = 1;
      const errorMock = new Error('jest-test-error');
      redisCacheService.get.mockRejectedValueOnce(errorMock);

      redisCacheService.set.mockRejectedValueOnce(new Error('jest-test-error'));

      const result = await caslAbilityFactory
        .createForUser(userId)
        .then((res) => res)
        .catch((err) => err);

      expect(result).toStrictEqual(new InternalServerErrorException(errorMock));
    });
  });
});

const abilitiesMock = [];
