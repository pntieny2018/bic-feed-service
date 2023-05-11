import { SentryService } from '@app/sentry';
import { HttpException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { RecentSearchModel } from '../../../database/models/recent-search.model';
import { RecentSearchesDto } from '../dto/responses';
import { RecentSearchController } from '../recent-search.controller';
import { RecentSearchService } from '../recent-search.service';
import {
  cleanRecentSearchDto,
  createRecentSearchDto,
  getRecentSearchesDto,
  mockedRecentSearchList,
} from './mocks/recent-search-list.mock';
import { userMocked } from '../../v2-user/test/mock/user.dto.mock';

describe('RecentSearchController', () => {
  let recentSearchController: RecentSearchController;
  let recentSearchService: RecentSearchService;
  let sentryService: SentryService;
  let recentSearchModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [RecentSearchController],
      providers: [
        RecentSearchService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(RecentSearchModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findOrCreate: jest.fn(),
            count: jest.fn(),
            destroy: jest.fn(),
            changed: jest.fn(),
            set: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    recentSearchController = module.get<RecentSearchController>(RecentSearchController);
    recentSearchService = module.get<RecentSearchService>(RecentSearchService);
    recentSearchModel = module.get<typeof RecentSearchModel>(getModelToken(RecentSearchModel));
    sentryService = module.get<SentryService>(SentryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create recent search', () => {
    it('Create recent search successfully', async () => {
      recentSearchService.create = jest.fn().mockResolvedValue(createRecentSearchDto);
      const rsp = await recentSearchController.createRecentSearch(
        userMocked,
        createRecentSearchDto
      );
      expect(rsp).toEqual(createRecentSearchDto);
    });

    it(`Can catch exception`, async () => {
      recentSearchModel.findOne.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchController.createRecentSearch(userMocked, createRecentSearchDto);
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('Delete recent search', () => {
    it('Delete recent search successfully', async () => {
      const rsp = await recentSearchController.deleteRecentSearch(
        userMocked,
        mockedRecentSearchList[0].id
      );
      expect(rsp).toEqual(true);
      expect(recentSearchModel.destroy).toBeCalledTimes(1);
    });
    it(`Can catch exception`, async () => {
      recentSearchModel.destroy.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchController.deleteRecentSearch(userMocked, mockedRecentSearchList[0].id);
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('Clean recent search', () => {
    it('Clean recent search successfully', async () => {
      const rsp = await recentSearchController.cleanRecentSearches(
        userMocked,
        cleanRecentSearchDto
      );
      expect(rsp).toEqual(true);
      expect(recentSearchModel.destroy).toBeCalledTimes(1);
    });
    it(`Can catch exception`, async () => {
      recentSearchModel.destroy.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchController.cleanRecentSearches(userMocked, cleanRecentSearchDto);
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('Get recent search', () => {
    it('Should successfully', async () => {
      recentSearchModel.findAll.mockResolvedValue(mockedRecentSearchList);
      const rsp = await recentSearchController.getRecentSearches(userMocked, getRecentSearchesDto);
      expect(rsp).toEqual(
        plainToClass(
          RecentSearchesDto,
          { target: getRecentSearchesDto.target, recentSearches: mockedRecentSearchList },
          { excludeExtraneousValues: true }
        )
      );
    });
  });
});
