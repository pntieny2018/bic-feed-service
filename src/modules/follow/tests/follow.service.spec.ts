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

describe('FollowService', () => {
  let followService: FollowService;
  let internalEventEmitterService;
  let sequelize;
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
  })

  describe('FollowService.unfollow', () => {
    it('should call destroy and emit', async () => {
      await followService.unfollow(createFollowDtoMock)
      expect(model.destroy).toBeCalled()
      expect(internalEventEmitterService.emit).toBeCalled()
    })
  })

});
