import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../driven-adapter/repository/user.repository';
import { RedisService } from '@app/redis';
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { IUserRepository } from '../../../domain/repositoty-interface/user.repository.interface';
import { bfProfile, cacheSG, cacheSU, permissionCacheKey } from '../../mock/user-store.dto.mock';
import * as rxjs from 'rxjs';
import { UserEntity } from '../../../domain/model/user';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('UserRepository', () => {
  let repo: IUserRepository;
  let store: RedisService;

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
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>(),
        },
      ],
    }).compile();
    store = module.get(RedisService);
    repo = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserName', () => {
    it('Should returned a UserEntity', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(bfProfile);
      jest.spyOn(store, 'mget').mockResolvedValue([permissionCacheKey, cacheSU]);
      const result = await repo.findByUserName(bfProfile.username);
      expect(result).toEqual(new UserEntity({ ...cacheSU, permissions: permissionCacheKey }));
    });

    it('Should return null because property is empty', async () => {
      const result = await repo.findByUserName('');
      expect(result).toEqual(null);
    });

    it('Should returned a UserEntity get data from GroupService', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(bfProfile);
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: { data: { ...cacheSU, permissions: permissionCacheKey } },
        status: 200,
      });
      const result = await repo.findByUserName(bfProfile.username);
      expect(result).toEqual(new UserEntity({ ...cacheSU, permissions: permissionCacheKey }));
    });

    it('Should return null because data is not found', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(bfProfile);
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: { data: {} },
        status: 400,
      });
      const result = await repo.findByUserName(bfProfile.username);
      expect(result).toEqual(null);
    });

    it('Should return null because call Group API has exception', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(bfProfile);
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockRejectedValue(new InternalServerErrorException());
      const result = await repo.findByUserName(bfProfile.username);
      expect(result).toEqual(null);
    });
  });

  describe('findOne', () => {
    it('Should returned a UserEntity', async () => {
      repo['_getUserFromCacheById'] = jest.fn().mockResolvedValue(cacheSU);
      const result = await repo.findOne(bfProfile.id);
      expect(result).toEqual(new UserEntity(cacheSU));
    });

    it('Should returned a UserEntity get data from GroupService', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(null);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: { data: [{ ...cacheSU }] },
        status: 200,
      });
      const result = await repo.findOne(bfProfile.id);
      expect(result).toEqual(new UserEntity({ ...cacheSU }));
    });

    it('Should return null because data is not found', async () => {
      jest.spyOn(store, 'get').mockResolvedValue(null);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: { data: [] },
        status: 400,
      });
      const result = await repo.findOne(bfProfile.id);
      expect(result).toEqual(null);
    });

    it('Should return null because call Group API has exception', async () => {
      repo['_getUserFromCacheById'] = jest.fn().mockResolvedValue(null);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({status: 500});
      const result = await repo.findOne(bfProfile.id);
      expect(result).toEqual(null);
    });
  });

  describe('findAllByIds', () => {
    it('Should returned a list UserEntity', async () => {
      jest.spyOn(store, 'mget').mockResolvedValue([cacheSU]);
      const result = await repo.findAllByIds([bfProfile.id]);
      expect(result).toEqual([new UserEntity(cacheSU)]);
    });

    it('Should returned a list UserEntity get data from GroupService', async () => {
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: { data: [{ ...cacheSU }] },
        status: 200,
      });
      const result = await repo.findAllByIds([bfProfile.id]);
      expect(result).toEqual([new UserEntity({ ...cacheSU })]);
    });

    it('Should returned a emtpty list because call Group API has exception', async () => {
      jest.spyOn(store, 'mget').mockResolvedValue([]);
      jest.spyOn(rxjs, 'lastValueFrom').mockRejectedValue(new InternalServerErrorException());
      const result = await repo.findAllByIds([bfProfile.id]);
      expect(result).toEqual([]);
    });
  });

  describe('canCudTagInCommunityByUserId', () => {
    it('Should returned boolean', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockResolvedValue({
        data: false,
        status: 200,
      });
      const result = await repo.canCudTagInCommunityByUserId(bfProfile.id, cacheSG.rootGroupId);
      expect(result).toEqual(false);
    });

    it('Should returned false', async () => {
      jest.spyOn(rxjs, 'lastValueFrom').mockRejectedValue(new InternalServerErrorException());
      const result = await repo.canCudTagInCommunityByUserId(bfProfile.id, cacheSG.rootGroupId);
      expect(result).toEqual(false);
    });
  });
});
