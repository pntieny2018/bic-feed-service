import { Test, TestingModule } from '@nestjs/testing';
import { HashtagService } from '../hashtag.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { HashtagModel } from '../../../database/models/hashtag.model';
import { modelGetResult } from './mocks/get-hashtags.mock';
import { HashtagResponseDto } from '../dto/responses/hashtag-response.dto';
import { createHashtagDto } from './mocks/create-hashtag-dto.mock';
import { PostHashtagModel } from '../../../database/models/post-hashtag.model';

describe('HashtagService', () => {
  let hashtagService;
  let hashtagModel;
  let postHashtagModel;

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
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostHashtagModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
      ],
    }).compile();

    hashtagService = module.get<HashtagService>(HashtagService);
    hashtagModel = module.get<typeof HashtagModel>(getModelToken(HashtagModel));
    postHashtagModel = module.get<typeof PostHashtagModel>(getModelToken(PostHashtagModel));
  })

  describe('HashtagService.getHashtag', () => {
    it('should return hashtag', async () => {
      const logSpy = jest.spyOn(hashtagService['_logger'], 'debug').mockReturnThis();

      hashtagModel.findAll.mockResolvedValue(modelGetResult);

      const hashtag = await hashtagService.getHashtag(authUserMock, {offset: 0, limit: 10})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(hashtag).toEqual({
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

      const hashtag = await hashtagService.getHashtag(authUserMock, {offset: 1, limit: 2})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(hashtag).toEqual({
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

      const hashtag = await hashtagService.getHashtag(authUserMock, {offset: 0, limit: 10, level: 3})

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findAll).toBeCalled();
      expect(hashtag).toEqual({
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

      const hashtag = await hashtagService.createHashtag('bein')

      expect(logSpy).toBeCalled();
      expect(hashtagModel.findOrCreate).toBeCalled();
      expect(hashtag).toEqual(modelGetResult[0]);
    });

  })

  describe('HashtagService.addPostToHashtags', () => {
    it('should success', async () => {
      const hashtag = await hashtagService.addPostToHashtags(['1'], '1', null)

      expect(postHashtagModel.bulkCreate).toBeCalled();
    });
  })

  describe('HashtagService.setHashtagsByPost', () => {
    it('should success', async () => {
      postHashtagModel.findAll.mockResolvedValue([{hashtagId: '1', postId: '1'}])
      const hashtag = await hashtagService.setHashtagsByPost(['2'], '1', null)

      expect(postHashtagModel.findAll).toBeCalled();
      expect(postHashtagModel.bulkCreate).toBeCalled();
      expect(postHashtagModel.destroy).toBeCalled();
    });
  })

  describe('HashtagService.findOrCreateHashtags', () => {
    it('should success', async () => {
      hashtagModel.findAll.mockResolvedValue([{id: '1', name: 'Haha'}])
      hashtagModel.bulkCreate.mockResolvedValue([{id: '1', name: 'haha', slug: 'haha'}])
      const hashtagId = await hashtagService.findOrCreateHashtags(['haha'])

      expect(hashtagModel.findAll).toBeCalled();
      expect(hashtagModel.bulkCreate).toBeCalled();
      expect(hashtagId).toEqual(['1', '1']);
    });
  })
})
