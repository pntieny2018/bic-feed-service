import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { GROUP_APPLICATION_TOKEN, GroupApplicationService } from '../../../../v2-group/application';
import { FindTagsPaginationHandler } from '../../../application/query/tag';
import { TagEntity } from '../../../domain/model/tag';
import { TAG_QUERY_TOKEN } from '../../../domain/query-interface';
import { TagQuery } from '../../../driven-adapter/query';

describe('FindTagsPaginationHandler', () => {
  let groupAppService, tagQuery, handler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindTagsPaginationHandler,
        {
          provide: GROUP_APPLICATION_TOKEN,
          useValue: createMock<GroupApplicationService>(),
        },
        {
          provide: TAG_QUERY_TOKEN,
          useValue: createMock<TagQuery>(),
        },
      ],
    }).compile();
    handler = module.get<FindTagsPaginationHandler>(FindTagsPaginationHandler);
    groupAppService = module.get(GROUP_APPLICATION_TOKEN);
    tagQuery = module.get(TAG_QUERY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should find tags success', async () => {
      const groupId = v4();
      const page = 1;
      const limit = 10;
      const tags = [
        {
          id: v4(),
          groupId: groupId,
          name: 'tag1',
          slug: 'tag1',
          totalUsed: 0,
          createdBy: v4(),
          updatedBy: v4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: v4(),
          groupId: groupId,
          name: 'tag2',
          slug: 'tag2',
          totalUsed: 0,
          createdBy: v4(),
          updatedBy: v4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const tagEntities = tags.map((tag) => new TagEntity(tag));
      jest.spyOn(tagQuery, 'getPagination').mockResolvedValue({ rows: tagEntities, total: 2 });
      const groupChildrenData = {
        id: v4(),
        name: 'group2',
        slug: 'group2',
        child: { open: [], private: [], closed: [], secret: [] },
      };
      const groupChildren = { open: [groupChildrenData.id], private: [], closed: [], secret: [] };
      const rootGroup = { id: groupId, name: 'group1', slug: 'group1', child: groupChildren };
      jest
        .spyOn(groupAppService, 'findAllByIds')
        .mockResolvedValueOnce([rootGroup])
        .mockResolvedValueOnce([groupChildrenData]);
      const result = await handler.execute({ payload: { groupIds: [groupId], page, limit } });
      expect(result).toEqual({
        rows: tags.map((tag) => ({
          id: tag.id,
          groupId: tag.groupId,
          name: tag.name,
          slug: tag.slug,
          groups: [
            {
              id: rootGroup.id,
              name: rootGroup.name,
              slug: rootGroup.slug,
            },
            {
              id: groupChildrenData.id,
              name: groupChildrenData.name,
              slug: groupChildrenData.slug,
            },
          ],
          totalUsed: tag.totalUsed,
        })),
        total: 2,
      });
    });
  });
});
