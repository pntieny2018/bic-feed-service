import { Test, TestingModule } from '@nestjs/testing';
import { HashtagService } from '../hashtag.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { HashtagModel } from '../../../database/models/hashtag.model';
import { modelGetResult } from './mocks/get-hashtags.mock';
import { HashtagResponseDto } from '../dto/responses/hashtag-response.dto';
import { createHashtagDto } from './mocks/create-hashtag-dto.mock';

describe('HashtagService', () => {
  let hashtagService;
  let hashtagModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashtagService,
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
          provide: getModelToken(HashtagModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
          },
        },
      ],
    }).compile();

    hashtagService = module.get<HashtagService>(HashtagService);
    hashtagModel = module.get<typeof HashtagModel>(getModelToken(HashtagModel));
  })

  describe('HashtagService.getHashtag', () => {
    it('should return hashtag', async () => {
      const logSpy = jest.spyOn(hashtagService['_logger'], 'debug').mockReturnThis();

      hashtagModel.findAll.mockResolvedValue(modelGetResult);

      const categories = await hashtagService.getHashtag(authUserMock, {offset: 0, limit: 10})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": modelGetResult.map((e) => new HashtagResponseDto(e)),
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 5
        }
      });
    });

    it('return index 2,3 if offset to 1 and limit to 2', async () => {
      const logSpy = jest.spyOn(hashtagService['_logger'], 'debug').mockReturnThis();

      hashtagModel.findAll.mockResolvedValue(modelGetResult);

      const categories = await hashtagService.getHashtag(authUserMock, {offset: 1, limit: 2})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": modelGetResult.slice(2,4).map((e) => new HashtagResponseDto(e)),
        "meta": {
          "limit": 2,
          "offset": 1,
          "total": 5
        }
      });
    });

    it('return index 4 if level set to 3', async () => {
      const logSpy = jest.spyOn(hashtagService['_logger'], 'debug').mockReturnThis();

      hashtagModel.findAll.mockResolvedValue([modelGetResult[4]]);

      const categories = await hashtagService.getHashtag(authUserMock, {offset: 0, limit: 10, level: 3})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(categories).toEqual({
        "list": [new HashtagResponseDto(modelGetResult[4])],
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 1
        }
      });
    });
  })

  describe('HashtagService.createHashtag', () => {
    it('should return hashtag', async () => {
      const logSpy = jest.spyOn(hashtagService['_logger'], 'debug').mockReturnThis();

      hashtagModel.findOrCreate.mockResolvedValue([modelGetResult[0],false]);

      const categories = await hashtagService.createHashtag(authUserMock, createHashtagDto)

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findOrCreate).toBeCalled();
      expect(categories).toEqual(modelGetResult[0]);
    });

  })
})
