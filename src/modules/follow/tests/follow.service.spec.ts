import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from '../follow.service';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { FollowModel } from '../../../database/models/follow.model';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { SentryService } from '@app/sentry';
import {
  createFollowDtoMock, emptyCreateFollowDtoMock,
  emptyGroupIdsCreateFollowDtoMock,
  emptyUserIdsCreateFollowDtoMock,
} from './mocks/create-follow-dto.mock';
import { emitKeypressEvents } from 'readline';
import { LogicException } from '../../../common/exceptions';

describe('FollowService', () => {
  let followService: FollowService;
  let internalEventEmitterService;
  let sequelize;
  let sentry;
  let model;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
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
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: getModelToken(FollowModel),
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            sequelize: {
              query: jest.fn(),
            }
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

    followService = module.get<FollowService>(FollowService);
    sequelize = module.get<Sequelize>(Sequelize);
    internalEventEmitterService = module.get<InternalEventEmitterService>(InternalEventEmitterService);
    sentry = module.get<SentryService>(SentryService);
    model = module.get<typeof FollowModel>(getModelToken(FollowModel))
  });

  it('should be defined', () => {
    expect(followService).toBeDefined();
  });

  describe('FollowService.follow', () => {
    it('should sequelize query and event emit', async () => {
      await followService.follow(createFollowDtoMock)
      expect(model.sequelize.query).toBeCalled();
      expect(internalEventEmitterService.emit).toBeCalled();
    })
    it('should sequelize query and event emit when empty user ids', async () => {
      await followService.follow(emptyUserIdsCreateFollowDtoMock)
      expect(model.sequelize.query).toBeCalled();
      expect(internalEventEmitterService.emit).toBeCalled();
    })
    it('should sequelize query and event emit when empty group ids', async () => {
      await followService.follow(emptyGroupIdsCreateFollowDtoMock)
      expect(model.sequelize.query).toBeCalled();
      expect(internalEventEmitterService.emit).toBeCalled();
    })
    it('should sequelize query and event emit when empty all', async () => {
      await followService.follow(emptyCreateFollowDtoMock)
      expect(model.sequelize.query).toBeCalled();
      expect(internalEventEmitterService.emit).toBeCalled();
    })
    it('should call logger and sentry if query fail', async () => {
      sequelize.query.mockRejectedValue(new Error('Whatever error'));
      try {
        await followService.follow(emptyCreateFollowDtoMock)

      } catch (e) {
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FollowService.unfollow', () => {
    it('should call destroy and emit', async () => {
      await followService.unfollow(createFollowDtoMock)
      expect(model.destroy).toBeCalled()
      expect(internalEventEmitterService.emit).toBeCalled()
    })
    it('should call logger and sentry if query fail', async () => {
      model.destroy.mockRejectedValue(new Error('Whatever error'));
      try {
        await followService.unfollow(createFollowDtoMock)

      } catch (e) {
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FollowService.getUniqueUserFollows', () => {
    it('should call query', async () => {
      sequelize.query.mockResolvedValue([[{user_id: 1, id: 2}], false])
      await followService.getUserFollowGroupIds([], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26', '4ee9fe89-99ff-43bd-bb85-2170ff7a3914'])
      expect(sequelize.query).toBeCalled()
    })

    it('should call logger and sentry if query fail', async () => {
      const logSpy = jest.spyOn(followService['_logger'], 'error').mockReturnThis();

      sequelize.query.mockRejectedValue(new Error('Whatever error'));
      try {
        await followService.getUserFollowGroupIds([], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26', '4ee9fe89-99ff-43bd-bb85-2170ff7a3914'])

      } catch (e) {
        expect(logSpy).toBeCalled();
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FollowService.filterUserFollows', () => {
    it('should call query', async () => {
      const logSpy = jest.spyOn(followService['_logger'], 'debug').mockReturnThis();

      sequelize.query.mockResolvedValue([[{user_id: 1, id: 2}], false])
      await followService.gets([], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'])
      expect(logSpy).toBeCalled();
      expect(sequelize.query).toBeCalled()
    })

    it('should call logger and sentry if query fail', async () => {
      const logSpy = jest.spyOn(followService['_logger'], 'error').mockReturnThis();

      sequelize.query.mockRejectedValue(new Error('Whatever error'));
      try {
        await followService.gets([], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'])

      } catch (e) {
        expect(logSpy).toBeCalled();
        expect(sentry.captureException).toBeCalled()
      }
    })
  })

  describe('FollowService.getValidUserIds', () => {
    it('should call query', async () => {
      sequelize.query.mockResolvedValue([[{user_id: '2c4738ec-0da2-465b-83bc-6c85fd01d862', id: 2}], false])
      await followService.getValidUserIds(['2c4738ec-0da2-465b-83bc-6c85fd01d862', 'a0ceb67b-1cf9-4f10-aa60-3ee6473017a3'], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'])
      expect(sequelize.query).toBeCalled()
    })

    it('should return [] if query null', async () => {
      sequelize.query.mockResolvedValue(null)
      const value = await followService.getValidUserIds(['2c4738ec-0da2-465b-83bc-6c85fd01d862', 'a0ceb67b-1cf9-4f10-aa60-3ee6473017a3'], ['43f306ba-a89f-4d43-8ee8-4d51fdcd4b13', '655a4c00-c245-4399-b64c-5ffa674a7c26'])
      expect(sequelize.query).toBeCalled()
      expect(value).toEqual([])
    })
  })

});
