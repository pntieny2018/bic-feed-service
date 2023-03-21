import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { TagModel } from '../../../../../database/models/tag.model';
import { TagEntity } from '../../../domain/model/tag';
import { GetPaginationTagProps } from '../../../domain/query-interface';
import { TagQuery } from '../../../driven-adapter/query';
import { userMock } from '../../mock/user.dto.mock';
import { ITagFactory, TAG_FACTORY_TOKEN, TagFactory } from '../../../domain/factory';

describe('TagQuery', () => {
  let query, tagModel;
  let factory: ITagFactory;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagQuery,
        {
          provide: getModelToken(TagModel),
          useValue: createMock<TagModel>(),
        },
        {
          provide: TAG_FACTORY_TOKEN,
          useValue: createMock<TagFactory>(),
        },
      ],
    }).compile();
    factory = module.get(TAG_FACTORY_TOKEN);
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

    it('Should pagination success', async () => {
      const input: GetPaginationTagProps = {
        limit: 10,
        offset: 0,
        groupIds: [v4()],
      };
      jest
        .spyOn(tagModel, 'findAndCountAll')
        .mockResolvedValue({ rows: tagRecords, count: input.limit });
      jest
        .spyOn(factory, 'reconstitute')
        .mockImplementation((tagRecord) => new TagEntity(tagRecord));
      const result = await query.getPagination(input);

      expect(tagModel.findAndCountAll).toBeCalledWith({
        where: {
          groupId: input.groupIds,
        },
        offset: input.offset,
        limit: input.limit,
        order: [
          ['totalUsed', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });
      const entities = tagRecords.map((row) => new TagEntity(row));
      expect(result.rows).toEqual(entities);
      expect(result.total).toEqual(input.limit);
    });
  });
});
