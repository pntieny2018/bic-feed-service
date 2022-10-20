import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from '../media.service';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MediaModel, MediaStatus, MediaType } from '../../../database/models/media.model';
import { PostMediaModel } from '../../../database/models/post-media.model';
import { CommentMediaModel } from '../../../database/models/comment-media.model';
import { SentryService } from '@app/sentry';
import { mockUserDto } from '../../post/test/mocks/input.mock';
import { createMediaDtoMock } from './mocks/create-media-dto.mock';
import { createMock } from '@golevelup/ts-jest';
import { Transaction } from 'sequelize';
import { EntityType } from '../media.constants';
import { KAFKA_PRODUCER } from '../../../common/constants';
import { ClientKafka } from '@nestjs/microservices';
import { PostModel } from '../../../database/models/post.model';

describe('MediaService', () => {
  let service: MediaService;
  let mediaModel;
  let postMediaModel;
  let commentMediaModel;
  let postModel;
  let sentryService;
  let transactionMock;
  let sequelize;
  let clientKafka: ClientKafka;

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
        {
          provide: KAFKA_PRODUCER,
          useValue: {
            emit: jest.fn()
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
          provide: getModelToken(PostModel),
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
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
    commentMediaModel = module.get<typeof CommentMediaModel>(getModelToken(CommentMediaModel));
    sentryService = module.get<SentryService>(SentryService);
    clientKafka = module.get<ClientKafka>(KAFKA_PRODUCER);
    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('processVideo', () => {
    it('Should successfully', async () => {
      clientKafka.emit = jest.fn().mockResolvedValue(Promise.resolve());
      service.updateData = jest.fn().mockResolvedValue(Promise.resolve());

      await service.processVideo([
        '4cfcadc9-a8f9-49f4-b037-bd02ce96022d',
        '658a1165-ae1d-4e4b-b369-d3c296533fb2',
      ]);

      expect(clientKafka.emit).toBeCalledTimes(1);
      expect(service.updateData).toBeCalledTimes(1);
    });

    it('Should failed if have an error connecting to DB', async () => {
      clientKafka.emit = jest.fn().mockResolvedValue(Promise.resolve());
      service.updateData = jest.fn().mockRejectedValue(new Error('Error when connect to DB'));
      sentryService.captureException = jest.fn().mockResolvedValue(Promise.resolve());

      try {
        await service.processVideo([
          '4cfcadc9-a8f9-49f4-b037-bd02ce96022d',
          '658a1165-ae1d-4e4b-b369-d3c296533fb2',
        ]);
      } catch (e) {
        expect(e?.message).toEqual('Error when connect to DB');
      }

      expect(service.updateData).toBeCalledTimes(1);
      expect(clientKafka.emit).toBeCalledTimes(1);
      expect(sentryService.captureException).toBeCalledTimes(1);
    });
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

  describe('MediaService.checkValidMedia', () => {
    it('should return create if success', async () => {
      mediaModel.findAll.mockResolvedValue(Promise.resolve([]))
      const returnValue = await service.isValid(['1','2'], '8c846fe3-a615-42ae-958a-33a43d24a033')
      expect(mediaModel.findAll).toBeCalled()
      expect(returnValue).toEqual(true)
    });
  })

  describe('MediaService.createIfNotExist', () => {
    it('should return create if success', async () => {
      mediaModel.findAll.mockResolvedValue(Promise.resolve([]))
      mediaModel.bulkCreate.mockResolvedValue(Promise.resolve([]))
      const returnValue = await service.createIfNotExist({images: [], files: [], videos: []}, '8c846fe3-a615-42ae-958a-33a43d24a033')
      expect(mediaModel.findAll).toBeCalled()
      expect(mediaModel.bulkCreate).toBeCalled()
      expect(returnValue).toEqual([])
    });
  })

  describe('MediaService.updateData', () => {
    it('should return if success', async () => {
      mediaModel.update.mockResolvedValue(Promise.resolve({}))
      const returnValue = await service.updateData(['12123'], { status: MediaStatus.COMPLETED })
      expect(mediaModel.update).toBeCalled()
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
