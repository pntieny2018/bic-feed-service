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
      userService.getMany.mockResolvedValue(Promise.resolve([1]))
      groupService.isMemberOfSomeGroups.mockResolvedValue(true)
      await service.checkValidMentions([1], [1])
      expect(userService.getMany).toBeCalled()
      expect(groupService.isMemberOfSomeGroups).toBeCalled()
    })

    it('should fail if not has authority', async () => {
      userService.getMany.mockResolvedValue(Promise.resolve([1]))
      groupService.isMemberOfSomeGroups.mockResolvedValue(false)
      try {
        await service.checkValidMentions([1], [1])

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
      await service.create([{mentionableType: MentionableType.POST, entityId: '1', userId: 1}])
      expect(model.bulkCreate).toBeCalled()
    })
  })

  describe('MentionService.resolveMentions', () => {
    it('return [] if input []', async () => {
      const result = await service.resolveMentions([])
      expect(result).toEqual([]);
    })
    it('should success', async () => {
      userService.getMany.mockResolvedValue(Promise.resolve([{id: 1}]))
      const result = await service.resolveMentions([1])
      expect(userService.getMany).toBeCalled()
      expect(result).toEqual([{id: 1}])
    })
  })

  describe('MentionService.bindMentionsToComment', () => {
    it('return success', async () => {
      const comments = [{
        parent: {
          mentions: [{
            userId: 1
          }]
        },
        mentions: [{
          userId: 1
        }],
        child: {
          list: [{
            mentions: [{
              userId: 1
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
            userId: 1
          }]
        },
        mentions: [{
          userId: 1
        }],
        child: {
          list: [{
            mentions: [{
              userId: 1
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
      model.findAll.mockResolvedValue(Promise.resolve([{userId: 1}]))
      model.bulkCreate.mockResolvedValue(Promise.resolve())
      const result = await service.setMention([1,2], MentionableType.POST, '123213', null);
      expect(model.findAll).toBeCalled()
      expect(model.destroy).not.toBeCalled()
      expect(model.bulkCreate).toBeCalled()
      expect(result).toEqual(true)
    })

    it('return destroy', async () => {
      model.findAll.mockResolvedValue(Promise.resolve([{userId: 3}]))
      model.destroy.mockResolvedValue(Promise.resolve())
      model.bulkCreate.mockResolvedValue(Promise.resolve())
      const result = await service.setMention([1,2], MentionableType.POST, '123213', null);
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
