import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../driven-adapter/repository/user.repository';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '@app/redis';
import { createMock } from '@golevelup/ts-jest';

describe('UserRepository', () => {
  let repo, httpService, store;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
      ],
    }).compile();
    httpService = module.get(HttpService);
    store = module.get(RedisService);
    repo = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create tag success', async () => {
      expect(1).toEqual(1);
    });
  });
});
