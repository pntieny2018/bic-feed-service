import { Test, TestingModule } from '@nestjs/testing';
import { GiphyController } from '../giphy.controller';
import { Rating } from '../dto/requests';
import { HttpService } from '@nestjs/axios';
import { SentryService } from '@app/sentry';
import { giphyResMock } from './mocks/giphy-res.mock';
import { HttpException } from '@nestjs/common';

describe('GiphyController', () => {
  let controller: GiphyController;
  let httpService;
  let sentryService;
  let axios;

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
    sentryService = module.get<SentryService>(SentryService);
    axios = httpService.axiosRef
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GiphyController.getTrending', () => {
    it('should httpService.get be called', async () => {
      axios.get.mockResolvedValue(giphyResMock);
      await controller.getTrending({limit: 25, rating: Rating.g})
      expect(axios.get).toBeCalled();
    })
    it('should sentry captureException', async () => {
      try {
        axios.get.mockRejectedValue(new HttpException('timeout', 500));
        await controller.getTrending({limit: 25, rating: Rating.g})
      } catch (e) {
        expect(sentryService.captureException).toBeCalled();
      }
    })
  })

  describe('GiphyController.search', () => {
    it('should httpService.get be called', async () => {
      axios.get.mockResolvedValue(giphyResMock);
      await controller.search({limit: 25, rating: Rating.g, q: 'bla bla'})
      expect(axios.get).toBeCalled();
    })
    it('should sentry captureException', async () => {
      try {
        axios.get.mockRejectedValue(new HttpException('timeout', 500));
        await controller.search({limit: 25, rating: Rating.g, q: 'bla bla'})
      } catch (e) {
        expect(sentryService.captureException).toBeCalled();
      }
    })
  })
})
