import { GetSeriesDto } from './../dto/requests/get-series.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from '../series.service';
import { SeriesModel } from '../../../database/models/series.model';
import { getModelToken } from '@nestjs/sequelize';
import { mockedCreateSeriesDto, mockedSeriesCreated } from './mocks/request/create-series.dto.mock';
import { mockedSeriesUpdated } from './mocks/request/update-series.dto.mock';
import { createMock } from '@golevelup/ts-jest';
import { Transaction } from 'sequelize';
import { LogicException } from '../../../common/exceptions';
import { Sequelize } from 'sequelize-typescript';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { mockedSeriesResponse } from './mocks/response/series.response.mock';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { SentryService } from '../../../../libs/sentry/src';
import { ExceptionHelper } from '../../../common/helpers';
import { mockedSeriesDeleted } from './mocks/request/delete-series.dto.mock';
import { PostSeriesModel } from '../../../database/models/post-series.model';

const slugify = require('slugify');

describe('SeriesService', () => {
  let seriesService: SeriesService;
  let seriesModelMock;
  let transactionMock;
  let sequelize: Sequelize;
  let sentryService: SentryService;
  let postSeriesModel;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        SeriesService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: ExceptionHelper,
          useValue: {
            throwLogicException: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getModelToken(SeriesModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostSeriesModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
      ],
    }).compile();

    seriesService = moduleRef.get<SeriesService>(SeriesService);
    seriesModelMock = moduleRef.get<typeof SeriesModel>(getModelToken(SeriesModel));
    postSeriesModel = moduleRef.get<typeof PostSeriesModel>(getModelToken(PostSeriesModel));
    sequelize = moduleRef.get<Sequelize>(Sequelize);
    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    sentryService = moduleRef.get<SentryService>(SentryService);
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(seriesService).toBeDefined();
  });

  describe('getSeries', () => {
    const getSeriesDto: GetSeriesDto = {};
    it('get series successfully', async () => {
      const seriesData = mockedSeriesCreated;
      const mockSeries = [
        {
          ...seriesData,
          toJSON: () => seriesData,
        },
      ];
      seriesModelMock.findAndCountAll.mockResolvedValue({
        rows: mockSeries,
        count: 1,
      });
      const result = await seriesService.getSeries(getSeriesDto);
      expect(result.list[0].name).toStrictEqual(mockedSeriesCreated.name);
    });

    it('Should catch exception when query DB error', async () => {
      seriesModelMock.findAndCountAll.mockRejectedValue(
        new Error('Any error when findAndCountAll data in DB')
      );
      try {
        await seriesService.getSeries(getSeriesDto);
      } catch (error) {
        expect(sentryService.captureException).toBeCalledTimes(1);
      }
    });
  });

  describe('createSeries', () => {
    it('Create series successfully', async () => {
      seriesModelMock.create = jest.fn().mockResolvedValue(mockedSeriesCreated);
      await seriesService.createSeries(mockedUserAuth, mockedCreateSeriesDto);
      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(seriesModelMock.create.mock.calls[0][0]).toStrictEqual({
        isActive: true,
        name: mockedCreateSeriesDto.name,
        slug: slugify(mockedCreateSeriesDto.name),
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      authUserMock.profile = null;
      try {
        await seriesService.createSeries(authUserMock, mockedCreateSeriesDto);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      seriesModelMock.create.mockRejectedValue(new Error('Any error when insert data to DB'));
      try {
        await seriesService.createSeries(mockedUserAuth, mockedCreateSeriesDto);
      } catch (error) {
        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updateSeries', () => {
    const mockedDataUpdateSeries = createMock<SeriesModel>(mockedSeriesUpdated);
    it('Update series successfully', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      seriesModelMock.update = jest.fn().mockResolvedValue(mockedSeriesUpdated);
      await seriesService.updateSeries(mockedUserAuth, mockedSeriesUpdated.id, mockedSeriesUpdated);
      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(seriesModelMock.update.mock.calls[0][0]).toStrictEqual({
        isActive: true,
        name: mockedDataUpdateSeries.name,
        slug: slugify(mockedDataUpdateSeries.name),
      });
    });

    it('Should catch exception if series not found', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(null);
      try {
        await seriesService.updateSeries(authUserMock, mockedSeriesUpdated.id, mockedSeriesUpdated);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch ForbiddenException if user is not owner series', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      authUserMock.id = '2a47c42d-f41d-457d-8359-707f4d0ab242';
      try {
        await seriesService.updateSeries(authUserMock, mockedSeriesUpdated.id, mockedSeriesUpdated);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch exception if creator not found in cache', async () => {
      authUserMock.profile = null;
      try {
        await seriesService.updateSeries(authUserMock, mockedSeriesUpdated.id, mockedSeriesUpdated);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('deleteSeries', () => {
    it('Delete series successfully', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      seriesModelMock.destroy = jest.fn().mockResolvedValue(mockedSeriesDeleted);
      await seriesService.deleteSeries(mockedUserAuth, mockedSeriesDeleted.id);
      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
    });

    it('Should catch exception if series not found', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(null);
      try {
        await seriesService.deleteSeries(authUserMock, mockedSeriesDeleted.id);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch ForbiddenException if user is not owner series', async () => {
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      authUserMock.id = '2a47c42d-f41d-457d-8359-707f4d0ab242';
      try {
        await seriesService.deleteSeries(authUserMock, mockedSeriesDeleted.id);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch exception if creator not found in cache', async () => {
      authUserMock.profile = null;
      try {
        await seriesService.deleteSeries(authUserMock, mockedSeriesDeleted.id);
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('checkSeriesOwner', () => {
    it('check series owner true', async () => {
      const result = await seriesService.checkSeriesOwner(mockedSeriesResponse, '43f306ba-a89f-4d43-8ee8-4d51fdcd4b13');
      expect(result).toEqual(true);
    });

    it('Should catch exception if series not found', async () => {
      try {
        await seriesService.checkSeriesOwner(null, '43f306ba-a89f-4d43-8ee8-4d51fdcd4b13');
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });

    it('Should catch ForbiddenException if user is not owner series', async () => {
      try {
        await seriesService.checkSeriesOwner(mockedSeriesResponse, '2a47c42d-f41d-457d-8359-707f4d0ab242');
      } catch (e) {
        expect(e).toBeInstanceOf(LogicException);
      }
    });
  });

  describe('getSeriesById', () => {
    it('get series by id successful', async () => {
      const seriesData = mockedSeriesCreated;
      const mockSeries = {
        ...seriesData,
        toJSON: () => seriesData,
      };
      seriesModelMock.findOne.mockResolvedValue(mockSeries);
      const result = await seriesService.getSeriesById(mockedSeriesCreated.id);
      expect(result.name).toEqual(mockedSeriesCreated.name);
    });

    it('Should catch exception if series not found', async () => {
      seriesModelMock.findOne.mockRejectedValue(new Error('Any error when findOne data in DB'));
      try {
        await seriesService.getSeriesById('');
      } catch (e) {
        expect(sentryService.captureException).toBeCalledTimes(1);
      }
    });
  });
});
