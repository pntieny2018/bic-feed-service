import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { GiphyModel } from '../../../database/models/giphy.model';
import { GiphyService } from '../giphy.service';
import { Sequelize } from 'sequelize-typescript';

describe('GiphyService', () => {
  let giphyService;
  let giphyModel;
  let sequelizeConnection;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiphyService,
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
            escape: jest.fn(),
          },
        },
        {
          provide: getModelToken(GiphyModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
          },
        }
      ]
    }).compile();

    sequelizeConnection = module.get<Sequelize>(Sequelize);
    giphyService = module.get<GiphyService>(GiphyService);
    giphyModel = module.get<typeof GiphyModel>(getModelToken(GiphyModel));
  })

  describe('GiphyService.saveGiphyData', () => {
    it('Create if data not exist', async () => {
      await giphyService.saveGiphyData({
        id: '3pZipqyo1sqHDfJGtz',
        type: 'gif',
      })

      expect(giphyModel.findOne).toBeCalled();
      expect(giphyModel.create).toBeCalled();
    });

    it('Not create if data not exist', async () => {
      giphyModel.findOne.mockResolvedValue({
        id: 'gCGSJGI7kGdTmUB1yo',
        type: 'gif',
      })

      await giphyService.saveGiphyData({
        id: 'gCGSJGI7kGdTmUB1yo',
        type: 'gif',
      })

      expect(giphyModel.findOne).toBeCalled();
      expect(giphyModel.create).toBeCalledTimes(0);
    });
  })
})
