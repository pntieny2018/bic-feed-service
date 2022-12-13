import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from '../tag.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { TagModel } from '../../../database/models/tag.model';
import { modelGetResult } from './mocks/get-tags.mock';
import { TagResponseDto } from '../dto/responses/tag-response.dto';
import { createTagDto } from './mocks/create-tag-dto.mock';
import { PostTagModel } from '../../../database/models/post-tag.model';
import { GroupService } from '../../../shared/group';

describe('TagService', () => {
  let tagService;
  let tagModel;
  let postTagModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
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
          provide: getModelToken(TagModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostTagModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
            findByPk: jest.fn(),
            findOrCreate: jest.fn(),
            bulkCreate: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
            isMemberOfGroups: jest.fn(),
            getGroupIdsCanAccess: jest.fn(),
          },
        },
      ],
    }).compile();

    tagService = module.get<TagService>(TagService);
    tagModel = module.get<typeof TagModel>(getModelToken(TagModel));
    postTagModel = module.get<typeof PostTagModel>(getModelToken(PostTagModel));
  })

  describe.skip('TagService.get', () => {
    it('should return tag', async () => {
      const logSpy = jest.spyOn(tagService['_logger'], 'debug').mockReturnThis();

      tagModel.findAll.mockResolvedValue(modelGetResult);

      const tag = await tagService.get(authUserMock, {groupIds: ["c8ddd4d4-9a5e-4d93-940b-e332a8d0422d"],offset: 0, limit: 10})

      expect(logSpy).toBeCalled();
      expect(tagModel.findAll).toBeCalled();
      expect(tag).toEqual({
        "list": modelGetResult.map((e) => new TagResponseDto(e)),
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 5
        }
      });
    });

    it('return index 2,3 if offset to 1 and limit to 2', async () => {
      const logSpy = jest.spyOn(tagService['_logger'], 'debug').mockReturnThis();

      tagModel.findAll.mockResolvedValue(modelGetResult);

      const tag = await tagService.get(authUserMock, {offset: 1, limit: 2})

      expect(logSpy).toBeCalled();
      expect(tagModel.findAll).toBeCalled();
      expect(tag).toEqual({
        "list": modelGetResult.slice(2,4).map((e) => new TagResponseDto(e)),
        "meta": {
          "limit": 2,
          "offset": 1,
          "total": 5
        }
      });
    });

    it('return index 4 if level set to 3', async () => {
      const logSpy = jest.spyOn(tagService['_logger'], 'debug').mockReturnThis();

      tagModel.findAll.mockResolvedValue([modelGetResult[4]]);

      const tag = await tagService.get(authUserMock, {offset: 0, limit: 10, level: 3})

      expect(logSpy).toBeCalled();
      expect(tagModel.findAll).toBeCalled();
      expect(tag).toEqual({
        "list": [new TagResponseDto(modelGetResult[4])],
        "meta": {
          "limit": 10,
          "offset": 0,
          "total": 1
        }
      });
    });
  })

  describe.skip('TagService.create', () => {
    it('should return tag', async () => {
      const logSpy = jest.spyOn(tagService['_logger'], 'debug').mockReturnThis();

      tagModel.findOrCreate.mockResolvedValue([modelGetResult[0],false]);

      const tag = await tagService.create('bein')

      expect(logSpy).toBeCalled();
      expect(tagModel.findOrCreate).toBeCalled();
      expect(tag).toEqual(modelGetResult[0]);
    });

  })

  describe('TagService.addToPost', () => {
    it('should success', async () => {
      const tag = await tagService.addToPost(['1'], '1', null)

      expect(postTagModel.bulkCreate).toBeCalled();
    });
  })

  describe('TagService.updateToPost', () => {
    it('should success', async () => {
      postTagModel.findAll.mockResolvedValue([{tagId: '1', postId: '1'}])
      const tag = await tagService.updateToPost(['2'], '1', null)

      expect(postTagModel.findAll).toBeCalled();
      expect(postTagModel.bulkCreate).toBeCalled();
      expect(postTagModel.destroy).toBeCalled();
    });
  })

  describe('TagService.getTagsByIds', () => {
    it('should success', async () => {
      tagModel.findAll.mockResolvedValue([{
        id: 'db3431fe-ae93-4dec-9e2b-5f50e8a125f9',
        name: 'Toai Nguyet 3',
        slug: 'toai-nguyet-3',
        createdAt: new Date('2022-05-26T11:23:52.061Z'),
        groupId: 'c8ddd4d4-9a5e-4d93-940b-e332a8d0422d',
        createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
        updatedAt: new Date('2022-05-26T10:45:53.056Z'),
      }])
      const tagId = await tagService.getTagsByIds(['0ccfede5-fae6-4d3d-a5dc-12828315cf7d'])

      expect(tagModel.findAll).toBeCalled();
      expect(tagId).toEqual([
        {
          "groupId": "c8ddd4d4-9a5e-4d93-940b-e332a8d0422d",
          "id": "db3431fe-ae93-4dec-9e2b-5f50e8a125f9",
          "name": "Toai Nguyet 3",
          "slug": "toai-nguyet-3"
        }
      ]);
    });
  })
})
