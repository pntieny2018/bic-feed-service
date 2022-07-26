import { Test, TestingModule } from '@nestjs/testing';
import { MentionService } from '../mention.service';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MentionModel } from '../../../database/models/mention.model';
import { LogicException } from '../../../common/exceptions';
import { MentionableType } from '../../../common/constants';

describe('MentionService', () => {
  let service: MentionService;
  let userService;
  let groupService;
  let model;
  let sequelize;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentionService,
        { provide: Sequelize, useValue: { query: jest.fn(), transaction: jest.fn() } },
        {
          provide: UserService,
          useValue: {
            getMany: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            isMemberOfSomeGroups: jest.fn(),
          },
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
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MentionService>(MentionService);
    userService = module.get<UserService>(UserService);
    groupService = module.get<GroupService>(GroupService);
    sequelize = module.get<Sequelize>(Sequelize);
    model = module.get<typeof MentionModel>(getModelToken(MentionModel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('MentionService.checkValidMentions', () => {
    it('should success', async () => {
      userService.getMany.mockResolvedValue(Promise.resolve(['61547513-521f-4dec-9c93-f4e4973d3008']))
      groupService.isMemberOfSomeGroups.mockResolvedValue(true)
      await service.checkValidMentions(['c233a814-1fe9-437d-9b7b-1babee5ccad5'], ['61547513-521f-4dec-9c93-f4e4973d3008'])
      expect(userService.getMany).toBeCalled()
      expect(groupService.isMemberOfSomeGroups).toBeCalled()
    })

    it('should fail if not has authority', async () => {
      userService.getMany.mockResolvedValue(Promise.resolve(['61547513-521f-4dec-9c93-f4e4973d3008']))
      groupService.isMemberOfSomeGroups.mockResolvedValue(false)
      try {
        await service.checkValidMentions(['c233a814-1fe9-437d-9b7b-1babee5ccad5'], ['61547513-521f-4dec-9c93-f4e4973d3008'])

      } catch (e) {
        expect(userService.getMany).toBeCalled()
        expect(groupService.isMemberOfSomeGroups).toBeCalled()
        expect(e).toBeInstanceOf(LogicException)
      }
    })
  })

  describe('MentionService.create', () => {
    it('should success', async () => {
      model.bulkCreate.mockResolvedValue(Promise.resolve())
      await service.create([{mentionableType: MentionableType.POST, entityId: '1', userId: '61547513-521f-4dec-9c93-f4e4973d3008'}])
      expect(model.bulkCreate).toBeCalled()
    })
  })

  describe('MentionService.resolveMentions', () => {
    it('return [] if input []', async () => {
      const result = await service.resolveMentions([])
      expect(result).toEqual([]);
    })
    it('should success', async () => {
      userService.getMany.mockResolvedValue(Promise.resolve([{id: '61547513-521f-4dec-9c93-f4e4973d3008'}]))
      const result = await service.resolveMentions(['61547513-521f-4dec-9c93-f4e4973d3008'])
      expect(userService.getMany).toBeCalled()
      expect(result).toEqual([{id: '61547513-521f-4dec-9c93-f4e4973d3008'}])
    })
  })

  describe('MentionService.bindMentionsToComment', () => {
    it('return success', async () => {
      const comments = [{
        parent: {
          mentions: [{
            userId: '61547513-521f-4dec-9c93-f4e4973d3008'
          }]
        },
        mentions: [{
          userId: '61547513-521f-4dec-9c93-f4e4973d3008'
        }],
        child: {
          list: [{
            mentions: [{
              userId: '61547513-521f-4dec-9c93-f4e4973d3008'
            }]
          }]
        }
      }]
      userService.getMany.mockResolvedValue(Promise.resolve([{id: 1}]))
      const beforeBind = Object.assign([], comments)
      await service.bindMentionsToComment(comments)
      expect(beforeBind).toEqual(comments)
    })
  })

  describe('MentionService.bindMentionsToPosts', () => {
    it('return success', async () => {
      const posts = [{
        parent: {
          mentions: [{
            userId: '61547513-521f-4dec-9c93-f4e4973d3008'
          }]
        },
        mentions: [{
          userId: '61547513-521f-4dec-9c93-f4e4973d3008'
        }],
        child: {
          list: [{
            mentions: [{
              userId: '61547513-521f-4dec-9c93-f4e4973d3008'
            }]
          }]
        }
      }]
      const beforeBind = Object.assign([], [posts])
      await service.bindMentionsToPosts([posts]);
      expect(beforeBind).toEqual([posts])
    })
  })

  describe('MentionService.setMention', () => {
    it('return success', async () => {
      model.findAll.mockResolvedValue(Promise.resolve([{userId: '61547513-521f-4dec-9c93-f4e4973d3008'}]))
      model.bulkCreate.mockResolvedValue(Promise.resolve())
      const result = await service.setMention(['c7bbf920-c3f1-4faf-8d56-bdbf2fa76f26', 'd8b5b8f8-000c-4182-b53d-a013e2e9ba20'], MentionableType.POST, '123213', null);
      expect(model.findAll).toBeCalled()
      expect(model.bulkCreate).toBeCalled()
      expect(result).toEqual(true)
    })

    it('return destroy', async () => {
      model.findAll.mockResolvedValue(Promise.resolve([{userId: '61547513-521f-4dec-9c93-f4e4973d3000'}]))
      model.destroy.mockResolvedValue(Promise.resolve())
      model.bulkCreate.mockResolvedValue(Promise.resolve())
      const result = await service.setMention(['c7bbf920-c3f1-4faf-8d56-bdbf2fa76f26', 'd8b5b8f8-000c-4182-b53d-a013e2e9ba20'], MentionableType.POST, '123213', null);
      expect(model.findAll).toBeCalled()
      expect(model.destroy).toBeCalled()
      expect(model.bulkCreate).toBeCalled()
      expect(result).toEqual(true)
    })
  })

  describe('MentionService.destroy', () => {
    it('return success for postId', async () => {
      sequelize.query.mockResolvedValue(true)
      const result = await service.destroy({postId: '1'}, null);
      expect(sequelize.query).toBeCalled()
      expect(result).toEqual(true)
    })
    it('return success for commentId', async () => {
      sequelize.query.mockResolvedValue(true)
      const result = await service.destroy({commentId: '1'}, null);
      expect(sequelize.query).toBeCalled()
      expect(result).toEqual(true)
    })
    it('return success for mentionIds', async () => {
      model.destroy.mockResolvedValue(true)
      const result = await service.destroy({mentionIds: [1]}, null);
      expect(model.destroy).toBeCalled()
      expect(result).toEqual(true)
    })
  })

  describe('MentionService.deleteMentionByEntityIds', () => {
    it('return success', async () => {
      model.destroy.mockResolvedValue(true)
      const result = await service.deleteMentionByEntityIds(['1'], MentionableType.POST, null);
      expect(model.destroy).toBeCalled()
      expect(result).toEqual(true)
    })
  })
});
