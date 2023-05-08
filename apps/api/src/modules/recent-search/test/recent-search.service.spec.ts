import { SentryService } from '@app/sentry';
import { createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { LIMIT_TOTAL_RECENT_SEARCH, RecentSearchType } from '..';
import { OrderEnum } from '../../../common/dto';
import { RecentSearchModel } from '../../../database/models/recent-search.model';
import { RecentSearchDto, RecentSearchesDto } from '../dto/responses';
import { RecentSearchService } from '../recent-search.service';
import { mockedRecentSearchList } from './mocks/recent-search-list.mock';

describe('RecentSearchService', () => {
  let recentSearchService: RecentSearchService;
  let recentSearchModelMock;
  let sentryService: SentryService;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
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

    recentSearchService = moduleRef.get<RecentSearchService>(RecentSearchService);
    recentSearchModelMock = moduleRef.get<typeof RecentSearchModel>(
      getModelToken(RecentSearchModel)
    );
    sentryService = moduleRef.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(recentSearchService).toBeDefined();
  });

  describe('Create recent search', () => {
    it('Should create new recent search if the keyword is not existed', async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { keyword, target, createdBy } = dataCreateMock;
      recentSearchModelMock.create.mockResolvedValueOnce(dataCreateMock);

      jest.spyOn(recentSearchService, 'needDeleteRecentSearchOverLimit');

      const result = await recentSearchService.create(createdBy, {
        keyword,
        target,
      });
      expect(recentSearchModelMock.changed).not.toHaveBeenCalled();
      expect(recentSearchModelMock.set).not.toHaveBeenCalled();
      expect(recentSearchModelMock.save).not.toHaveBeenCalled();
      expect(recentSearchService.needDeleteRecentSearchOverLimit).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(
        plainToClass(RecentSearchDto, dataCreateMock, {
          excludeExtraneousValues: true,
        })
      );

      const queryArgFindUsers: any = recentSearchModelMock.findOne.mock.calls[0][0];
      expect(queryArgFindUsers.where).toStrictEqual({
        keyword,
        createdBy,
        target,
      });

      const argCreate: any = recentSearchModelMock.create.mock.calls[0][0];
      expect(argCreate).toStrictEqual({
        keyword,
        createdBy,
        target,
        totalSearched: 1,
      });
      recentSearchModelMock.findOne.mockClear();
      recentSearchModelMock.create.mockClear();
    });
    it('Should update recent search if the keyword already existed', async () => {
      const dataCreateMock = createMock<RecentSearchModel>({
        ...mockedRecentSearchList[0],
        set: jest.fn(),
        changed: jest.fn(),
        save: jest.fn(),
      });

      const { keyword, target, createdBy, totalSearched } = dataCreateMock;
      recentSearchModelMock.findOne.mockResolvedValueOnce(dataCreateMock);
      jest.spyOn(recentSearchService, 'needDeleteRecentSearchOverLimit');

      const result = await recentSearchService.create(createdBy, {
        keyword,
        target,
      });

      expect(recentSearchModelMock.create).not.toBeCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataCreateMock.changed).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataCreateMock.set).toBeCalledWith({
        totalSearched: totalSearched + 1,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataCreateMock.save).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(recentSearchService.needDeleteRecentSearchOverLimit).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(
        plainToClass(RecentSearchDto, dataCreateMock, {
          excludeExtraneousValues: true,
        })
      );

      const queryArgFindUsers: any = recentSearchModelMock.findOne.mock.calls[0][0];
      expect(queryArgFindUsers.where).toStrictEqual({
        keyword,
        createdBy,
        target,
      });

      recentSearchModelMock.findOne.mockClear();
    });

    it('Can catch exception.', async () => {
      recentSearchModelMock.create.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchService.create(
          '85dfe22e-866d-49a5-bbef-3fbc72e4febf',
          mockedRecentSearchList[0]
        );
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }
      recentSearchModelMock.findAll.mockClear();
    });
  });

  describe('Delete oldest recent search if total items is over limit', () => {
    it(`Don't delete if total items <= ${LIMIT_TOTAL_RECENT_SEARCH}`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { createdBy } = dataCreateMock;
      jest.spyOn(recentSearchService, 'delete');
      recentSearchModelMock.count.mockResolvedValueOnce(LIMIT_TOTAL_RECENT_SEARCH);

      await recentSearchService.needDeleteRecentSearchOverLimit(createdBy);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(recentSearchService.delete).not.toHaveBeenCalled();
    });

    it(`Delete if total items > ${LIMIT_TOTAL_RECENT_SEARCH}`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { id, createdBy } = dataCreateMock;
      jest.spyOn(recentSearchService, 'delete');
      recentSearchModelMock.count.mockResolvedValueOnce(LIMIT_TOTAL_RECENT_SEARCH + 1);
      recentSearchModelMock.findOne.mockResolvedValueOnce(dataCreateMock);

      await recentSearchService.needDeleteRecentSearchOverLimit(createdBy);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(recentSearchService.delete).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(recentSearchService.delete).toHaveBeenLastCalledWith(createdBy, id);
    });
  });

  describe('Delete recent search', () => {
    it(`Delete successfully`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { id, createdBy } = dataCreateMock;

      await recentSearchService.delete(createdBy, id);
      expect(recentSearchModelMock.destroy).toHaveBeenCalledTimes(1);
      const queryArgFindUsers: any = recentSearchModelMock.destroy.mock.calls[0][0];
      expect(queryArgFindUsers.where).toStrictEqual({
        id,
        createdBy,
      });
    });

    it(`Can catch exception`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { id, createdBy } = dataCreateMock;
      recentSearchModelMock.destroy.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchService.delete(createdBy, id);
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('Clean all recent search by user', () => {
    it(`Clean successfully`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { createdBy, target } = dataCreateMock;

      await recentSearchService.clean(createdBy, target as RecentSearchType);
      expect(recentSearchModelMock.destroy).toHaveBeenCalledTimes(1);
      const queryArgFindUsers: any = recentSearchModelMock.destroy.mock.calls[0][0];
      expect(queryArgFindUsers.where).toStrictEqual({
        target,
        createdBy,
      });
    });

    it(`Can catch exception`, async () => {
      const dataCreateMock = createMock<RecentSearchModel>(mockedRecentSearchList[0]);
      const { createdBy, target } = dataCreateMock;
      recentSearchModelMock.destroy.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchService.clean(createdBy, target as RecentSearchType);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
      }
    });
  });

  describe('Get recent search', () => {
    const createdBy = '85dfe22e-866d-49a5-bbef-3fbc72e4febf';
    const defaultColumnSort = 'updatedAt';
    const sort = OrderEnum.DESC;
    it('Should be return empty list', async () => {
      const target = 'post' as RecentSearchType;
      const order = OrderEnum.DESC;
      const limit = 2;

      recentSearchModelMock.findAll.mockResolvedValueOnce([]);

      const result = await recentSearchService.get(createdBy, {
        limit,
        order,
        target,
      });
      expect(result).toStrictEqual(
        plainToClass(RecentSearchesDto, {
          target,
          recentSearches: [],
        })
      );

      const queryArgFindUsers: any = recentSearchModelMock.findAll.mock.calls[0][0];
      expect(queryArgFindUsers.limit).toBe(limit);
      expect(queryArgFindUsers.where).toStrictEqual({
        target,
        createdBy,
      });
      expect(queryArgFindUsers.order).toStrictEqual([[defaultColumnSort, sort]]);
      recentSearchModelMock.findAll.mockClear();
    });

    it('Can catch exception.', async () => {
      recentSearchModelMock.findAll.mockRejectedValue(new Error('any error'));
      try {
        await recentSearchService.get(createdBy, {});
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
        expect(e).toBeInstanceOf(HttpException);
      }

      recentSearchModelMock.findAll.mockClear();
    });
  });
});
