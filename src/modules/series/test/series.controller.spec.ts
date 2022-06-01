import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from '../series.service';
import { SeriesController } from '../series.controller';
import { mockedCreateSeriesDto } from './mocks/request/create-series.dto.mock';
import { mockedUpdateSeriesDto } from './mocks/request/update-series.dto.mock';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { GetSeriesDto } from '../dto/requests';
import { mockedSeriesResponse } from './mocks/response/series.response.mock';

jest.mock('../series.service');
describe('SeriesController', () => {
  let seriesService: SeriesService;
  let seriesController: SeriesController;
  const userDto = mockedUserAuth;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SeriesController],
      providers: [
        {
          provide: SeriesService,
          useValue: {
            createSeries: jest.fn(),
            updateSeries: jest.fn(),
            deleteSeries: jest.fn(),
            getSeries: jest.fn(),
            getSeriesById: jest.fn(),
            checkSeriesOwner: jest.fn(),
          },
        },
      ],
    }).compile();

    seriesService = moduleRef.get<SeriesService>(SeriesService);
    seriesController = moduleRef.get<SeriesController>(SeriesController);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(seriesController).toBeDefined();
  });

  describe('getSeries', () => {
    it('Get series successfully', async () => {
      seriesService.getSeries = jest.fn().mockResolvedValue(true);
      const getSeriesDto: GetSeriesDto = {};
      await seriesController.getSeries(getSeriesDto);
      expect(seriesService.getSeries).toBeCalledTimes(1);
      expect(seriesService.getSeries).toBeCalledWith({});
    });
  });

  describe('createSeries', () => {
    it('Create series successfully', async () => {
      seriesService.createSeries = jest.fn().mockResolvedValue({ id: mockedSeriesResponse.id });
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      const result = await seriesController.createSeries(userDto, mockedCreateSeriesDto);
      expect(seriesService.createSeries).toBeCalledTimes(1);
      expect(seriesService.createSeries).toBeCalledWith(userDto, mockedCreateSeriesDto);
      expect(seriesService.getSeriesById).toBeCalledTimes(1);
      expect(seriesService.getSeriesById).toBeCalledWith(mockedSeriesResponse.id);
      expect(result).toBe(mockedSeriesResponse);
    });
  });

  describe('updateSeries', () => {
    it('Update series successfully', async () => {
      seriesService.updateSeries = jest.fn().mockResolvedValue(true);
      seriesService.getSeriesById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      const result = await seriesController.updateSeries(
        userDto,
        mockedSeriesResponse.id,
        mockedUpdateSeriesDto
      );
      expect(seriesService.updateSeries).toBeCalledTimes(1);
      expect(seriesService.updateSeries).toBeCalledWith(
        userDto,
        mockedSeriesResponse.id,
        mockedUpdateSeriesDto
      );
      expect(seriesService.getSeriesById).toBeCalledTimes(1);
      expect(seriesService.getSeriesById).toBeCalledWith(mockedSeriesResponse.id);
      expect(result).toBe(mockedSeriesResponse);
    });
  });

  describe('deleteSeries', () => {
    it('Delete series successfully', async () => {
      seriesService.deleteSeries = jest.fn().mockResolvedValue(true);
      const result = await seriesController.deleteSeries(userDto, mockedSeriesResponse.id);
      expect(seriesService.deleteSeries).toBeCalledTimes(1);
      expect(seriesService.deleteSeries).toBeCalledWith(userDto, mockedSeriesResponse.id);
      expect(result).toBe(true);
    });

    it('Delete series failed', async () => {
      seriesService.deleteSeries = jest.fn().mockResolvedValue(false);
      const result = await seriesController.deleteSeries(userDto, mockedSeriesResponse.id);
      expect(seriesService.deleteSeries).toBeCalledTimes(1);
      expect(seriesService.deleteSeries).toBeCalledWith(userDto, mockedSeriesResponse.id);
      expect(result).toBe(false);
    });
  });
});
