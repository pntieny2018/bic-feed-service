import { Test, TestingModule } from '@nestjs/testing';
import { MentionService } from '../mention.service';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MentionModel } from '../../../database/models/mention.model';

describe('MentionService', () => {
  let service: MentionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentionService,
        { provide: Sequelize, useValue: { query: jest.fn(), transaction: jest.fn() } },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: GroupService,
          useValue: {},
        },
        {
          provide: getModelToken(MentionModel),
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
          provide: Sequelize,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MentionService>(MentionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
