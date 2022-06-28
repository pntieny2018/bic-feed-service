import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from '../media.service';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MediaModel, MediaStatus } from '../../../database/models/media.model';
import { PostMediaModel } from '../../../database/models/post-media.model';
import { CommentMediaModel } from '../../../database/models/comment-media.model';
import { SentryService } from '@app/sentry';
import { mockUserDto } from '../../post/test/mocks/input.mock';
import { createMediaDtoMock } from './mocks/create-media-dto.mock';
import { createMock } from '@golevelup/ts-jest';
import { Transaction } from 'sequelize';
import { EntityType } from '../media.constants';

describe('MediaService', () => {
  let service: MediaService;
  let mediaModel;
  let postMediaModel;
  let commentMediaModel;
  let sentryService;
  let transactionMock;
  let sequelize;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        { provide: Sequelize, useValue: { query: jest.fn(), transaction: jest.fn() } },
        {
          provide: getModelToken(MediaModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostMediaModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            count: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentMediaModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    sequelize = module.get<Sequelize>(Sequelize)
    mediaModel = module.get<typeof MediaModel>(getModelToken(MediaModel));
    postMediaModel = module.get<typeof PostMediaModel>(getModelToken(PostMediaModel));
    commentMediaModel = module.get<typeof CommentMediaModel>(getModelToken(CommentMediaModel));
    sentryService = module.get<SentryService>(SentryService);
    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('MediaService.create', () => {
    it('should return create if success', async () => {
      const logSpy = jest.spyOn(service['_logger'], 'debug').mockReturnThis();
      mediaModel.create.mockResolvedValue(createMediaDtoMock)
      const returnValue = await service.create(mockUserDto, createMediaDtoMock)
      expect(logSpy).toBeCalled()
      expect(mediaModel.create).toBeCalled()
      expect(returnValue).toEqual(createMediaDtoMock)
    });

    it('should sentry call if fail', async () => {
      const errorMessage = 'Something went wrong'
      mediaModel.create.mockRejectedValue(new Error(errorMessage))

      try {
        const returnValue = await service.create(mockUserDto, createMediaDtoMock)
      } catch (e) {
        expect(sentryService.captureException).toBeCalled()
        expect(mediaModel.create).toBeCalled()
        expect(e.message).toEqual('Can\'t create media')
      }
    });
  })

  describe('MediaService.destroy', () => {
    it('should return if success', async () => {
      mediaModel.create.mockResolvedValue(createMediaDtoMock)
      postMediaModel.destroy.mockResolvedValue(1)
      commentMediaModel.destroy.mockResolvedValue(1)
      mediaModel.destroy.mockResolvedValue(1)
      // transactionMock.commit.mockResolvedValue(true)
      const returnValue = await service.destroy(mockUserDto, {postId: 1, commentId: 1, mediaIds: [1,2]})
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(transactionMock.rollback).not.toBeCalled();
      expect(postMediaModel.destroy).toBeCalled()
      expect(commentMediaModel.destroy).toBeCalled()
      expect(mediaModel.destroy).toBeCalled()
      expect(returnValue).toEqual(true)
    });

    it('should sentry call if fail', async () => {
      const errorMessage = 'Something went wrong'
      mediaModel.destroy.mockRejectedValue(new Error(errorMessage))
      const logSpy = jest.spyOn(service['_logger'], 'error').mockReturnThis();

      try {
        await service.destroy(mockUserDto, {postId: 1, commentId: 1, mediaIds: [1,2]})
      } catch (e) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
        expect(logSpy).toBeCalled()
        expect(sentryService.captureException).toBeCalled()
        expect(e.message).toEqual('api.media.delete.app_error')
      }
    });
  })

  describe('MediaService.getMediaList', () => {
    it('should return create if success', async () => {
      mediaModel.findAll.mockResolvedValue(Promise.resolve([]))
      const returnValue = await service.getMediaList({})
      expect(mediaModel.findAll).toBeCalled()
      expect(returnValue).toEqual([])
    });
  })

  describe('MediaService.checkValidMedia', () => {
    it('should return create if success', async () => {
      mediaModel.findAll.mockResolvedValue(Promise.resolve([]))
      const returnValue = await service.checkValidMedia(['1','2'], 1)
      expect(mediaModel.findAll).toBeCalled()
      expect(returnValue).toEqual(true)
    });
  })

  describe('MediaService.createIfNotExist', () => {
    it('should return create if success', async () => {
      mediaModel.findAll.mockResolvedValue(Promise.resolve([]))
      mediaModel.bulkCreate.mockResolvedValue(Promise.resolve([]))
      const returnValue = await service.createIfNotExist({images: [], files: [], videos: []}, 1, transactionMock)
      expect(mediaModel.findAll).toBeCalled()
      expect(mediaModel.bulkCreate).toBeCalled()
      expect(returnValue).toEqual([])
    });
  })

  describe('MediaService.countMediaByPost', () => {
    it('should return if success', async () => {
      postMediaModel.count.mockResolvedValue(Promise.resolve(1))
      const returnValue = await service.countMediaByPost('12123')
      expect(postMediaModel.count).toBeCalled()
      expect(returnValue).toEqual(1)
    });
  })

  describe('MediaService.updateData', () => {
    it('should return if success', async () => {
      mediaModel.update.mockResolvedValue(Promise.resolve({}))
      const returnValue = await service.updateData(['12123'], { status: MediaStatus.COMPLETED })
      expect(mediaModel.update).toBeCalled()
    });
  })

  describe('MediaService.updateMediaDraft', () => {
    it('should return if success', async () => {
      sequelize.query.mockResolvedValue(Promise.resolve({}))
      const returnValue = await service.updateMediaDraft([1], null)
      expect(sequelize.query).toBeCalled()
      expect(returnValue).toEqual(true)
    });
  })

  describe('MediaService.sync', () => {
    it('should return if success', async () => {
      postMediaModel.findAll.mockResolvedValue(Promise.resolve([{mediaId: 1}]))
      const returnValue = await service.sync('1', EntityType.POST, ['1'], null)
      expect(postMediaModel.findAll).toBeCalled()
      expect(postMediaModel.bulkCreate).toBeCalled()
      expect(postMediaModel.destroy).toBeCalled()
    });
  })

  describe('MediaService.deleteMediaByEntityIds', () => {
    it('should return if success', async () => {
      postMediaModel.findAll.mockResolvedValue(Promise.resolve([{mediaId: 1}]))
      const returnValue = await service.deleteMediaByEntityIds(['1'], EntityType.POST, null)
      expect(postMediaModel.findAll).toBeCalled()
      expect(postMediaModel.destroy).toBeCalled()
    });
  })

});
