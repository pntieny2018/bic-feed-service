import { Test, TestingModule } from '@nestjs/testing';
import { GiphyController } from '../giphy.controller';
import { Rating } from '../dto/requests';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { SentryService } from '@app/sentry';

describe('GiphyController', () => {
  let controller: GiphyController;
  let httpService;
  let axios;

  const result: AxiosResponse = {
    data: {
      data: []
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiphyController],
      providers: [
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
            get: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GiphyController>(GiphyController);
    httpService = module.get<HttpService>(HttpService);
    axios = httpService.axiosRef
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GiphyController.getTrending', () => {
    it('should httpService.get be called', async () => {
      axios.get.mockResolvedValue(result);
      await controller.getTrending({limit: 25, rating: Rating.g})
      expect(axios.get).toBeCalled();
    })
  })

  describe('GiphyController.search', () => {
    it('should httpService.get be called', async () => {
      axios.get.mockResolvedValue(result);
      await controller.search({limit: 25, rating: Rating.g, q: 'bla bla'})
      expect(axios.get).toBeCalled();
    })
  })
})
