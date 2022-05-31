import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from '../follow.service';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { FollowModel } from '../../../database/models/follow.model';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { SentryService } from '@app/sentry';

describe('FollowService', () => {
  let service: FollowService;
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
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
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

    service = module.get<FollowService>(FollowService);
    model = module.get<typeof FollowModel>(getModelToken(FollowModel))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('FollowService.follow', () => {
    it('should sequelize query and event emit', async () => {

    })
  })

});
