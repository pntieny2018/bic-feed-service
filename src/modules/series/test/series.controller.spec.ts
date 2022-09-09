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
      seriesService.get = jest.fn().mockResolvedValue(true);
      const getSeriesDto: GetSeriesDto = {};
      await seriesController.get(getSeriesDto);
      expect(seriesService.get).toBeCalledTimes(1);
      expect(seriesService.get).toBeCalledWith({});
    });
  });

  describe('createSeries', () => {
    it('Create series successfully', async () => {
      seriesService.create = jest.fn().mockResolvedValue({ id: mockedSeriesResponse.id });
      seriesService.getById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      const result = await seriesController.create(userDto, mockedCreateSeriesDto);
      expect(seriesService.create).toBeCalledTimes(1);
      expect(seriesService.create).toBeCalledWith(userDto, mockedCreateSeriesDto);
      expect(seriesService.getById).toBeCalledTimes(1);
      expect(seriesService.getById).toBeCalledWith(mockedSeriesResponse.id);
      expect(result).toBe(mockedSeriesResponse);
    });
  });

  describe('updateSeries', () => {
    it('Update series successfully', async () => {
      seriesService.update = jest.fn().mockResolvedValue(true);
      seriesService.getById = jest.fn().mockResolvedValue(mockedSeriesResponse);
      const result = await seriesController.update(
        userDto,
        mockedSeriesResponse.id,
        mockedUpdateSeriesDto
      );
      expect(seriesService.update).toBeCalledTimes(1);
      expect(seriesService.update).toBeCalledWith(
        userDto,
        mockedSeriesResponse.id,
        mockedUpdateSeriesDto
      );
      expect(seriesService.getById).toBeCalledTimes(1);
      expect(seriesService.getById).toBeCalledWith(mockedSeriesResponse.id);
      expect(result).toBe(mockedSeriesResponse);
    });
  });

  describe('deleteSeries', () => {
    it('Delete series successfully', async () => {
      seriesService.delete = jest.fn().mockResolvedValue(true);
      const result = await seriesController.delete(userDto, mockedSeriesResponse.id);
      expect(seriesService.delete).toBeCalledTimes(1);
      expect(seriesService.delete).toBeCalledWith(userDto, mockedSeriesResponse.id);
      expect(result).toBe(true);
    });

    it('Delete series failed', async () => {
      seriesService.delete = jest.fn().mockResolvedValue(false);
      const result = await seriesController.delete(userDto, mockedSeriesResponse.id);
      expect(seriesService.delete).toBeCalledTimes(1);
      expect(seriesService.delete).toBeCalledWith(userDto, mockedSeriesResponse.id);
      expect(result).toBe(false);
    });
  });
});
