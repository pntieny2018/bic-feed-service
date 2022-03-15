import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { PostDto } from '../dto/responses';
import { mockedPostList } from './mocks/post-list';
import { HttpException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';

describe('PostService', () => {
  let recentSearchService: PostService;
  let recentSearchModelMock;
  let sentryService: SentryService;
  let eventEmitter: EventEmitter2;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findOrCreate: jest.fn(),
            count: jest.fn(),
            destroy: jest.fn(),
            changed: jest.fn(),
            set: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    recentSearchService = moduleRef.get<PostService>(PostService);
    recentSearchModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    sentryService = moduleRef.get<SentryService>(SentryService);
    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(recentSearchService).toBeDefined();
  });

  describe('Create recent search', () => {
    it('Should create new recent search if the keyword is not existed', async () => {});
  });
});
