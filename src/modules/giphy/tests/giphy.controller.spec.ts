import { Test, TestingModule } from '@nestjs/testing';
import { GiphyController } from '../giphy.controller';
import { Rating } from '../dto/requests';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

describe('GiphyController', () => {
  let controller: GiphyController;
  let httpService;

  const result: AxiosResponse = {
    data: 'Components',
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
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GiphyController>(GiphyController);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GiphyController.getTrending', () => {
    it('should httpService.get be called', async () => {
      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));
      await controller.getTrending({limit: 25, rating: Rating.g})
      expect(httpService.get).toBeCalled();
    })
  })

  describe('GiphyController.search', () => {
    it('should httpService.get be called', async () => {
      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(result));
      await controller.search({limit: 25, rating: Rating.g, q: 'bla bla'})
      expect(httpService.get).toBeCalled();
    })
  })
})
