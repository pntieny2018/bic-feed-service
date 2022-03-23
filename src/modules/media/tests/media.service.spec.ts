import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from '../media.service';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MediaModel } from '../../../database/models/media.model';
import { PostMediaModel } from '../../../database/models/post-media.model';
import { CommentMediaModel } from '../../../database/models/comment-media.model';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
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
          },
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
