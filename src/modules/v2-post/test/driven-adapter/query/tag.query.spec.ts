import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { TagModel } from '../../../../../database/models/tag.model';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { TagEntity } from '../../../domain/model/tag';
import { GetPaginationTagProps } from '../../../domain/query-interface';
import { TagQuery } from '../../../driven-adapter/query';
import { userMock } from '../../mock/user.dto.mock';
describe('TagQuery', () => {
  let query, tagModel;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagQuery,
        {
          provide: getModelToken(TagModel),
          useValue: createMock<TagModel>(),
        },
      ],
    }).compile();

    query = module.get<TagQuery>(TagQuery);
    tagModel = module.get<TagModel>(getModelToken(TagModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPagination', () => {
    const tagRecords = [];
    for (let i = 1; i <= 10; i++) {
      tagRecords.push({
        id: v4(),
        groupId: v4(),
        name: 'tag bbbdd12 ddffc 1dddf22',
        slug: 'tag-bbbdd12-ddffc-1dddf22',
        totalUsed: 0,
        updatedBy: userMock.id,
        createdBy: userMock.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    it('Should get tags success with group', async () => {
      const input: GetPaginationTagProps = {
        limit: 10,
        offset: 0,
        groupIds: [GroupId.fromString(v4())],
      };
      jest
        .spyOn(tagModel, 'findAndCountAll')
        .mockResolvedValue({ rows: tagRecords, count: input.limit });

      const result = await query.getPagination(input);

      expect(tagModel.findAndCountAll).toBeCalledWith({
        where: {
          groupId: input.groupIds.map((group) => group.value),
        },
        offset: input.offset,
        limit: input.limit,
        order: [
          ['totalUsed', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });
      const entities = tagRecords.map((row) => TagEntity.fromJson(row));
      expect(result.rows).toEqual(entities);
      expect(result.total).toEqual(input.limit);
    });
  });
});
