import { CategoryController } from '../../../driving-apdater/controller/category.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';
import { FindCategoriesPaginationQuery } from '../../../application/query/find-categories/find-categories-pagination.query';
import { GetCategoryDto } from '../../../driving-apdater/dto/request/get-category.dto';
import { FindCategoriesPaginationDto } from '../../../application/dto/category.dto';

describe('CategoryController', () => {
  let controller: CategoryController;
  let command: CommandBus;
  let query: QueryBus;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryController, CommandBus, QueryBus],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    command = module.get<CommandBus>(CommandBus);
    query = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const categoryMocks: FindCategoriesPaginationDto = {
    rows: [
      {
        id: '6b9fbc18-04c3-4a4a-bd64-453add6724dd',
        name: 'Outdoors',
        slug: 'outdoors',
        level: 1,
        parentId: null,
        active: true,
        createdBy: '6b9fbc18-04c3-4a4a-bd64-453add6724dd',
      },
      {
        id: 'ce8c7613-426d-48e4-8d74-c2a12adc05f9',
        name: 'Fashion & Beauty',
        slug: 'fashion-beauty',
        level: 1,
        parentId: null,
        active: true,
        createdBy: '6b9fbc18-04c3-4a4a-bd64-453add6724dd',
      },
    ],
    total: 0,
  };

  describe('Get', () => {
    it('Should get categories successfully', async () => {
      const getCategoryDto: GetCategoryDto = {
        name: 'Outdoors',
        level: 1,
        isCreatedByMe: true,
        offset: 0,
        limit: 10,
      };
      const queryExecute = jest.spyOn(query, 'execute').mockResolvedValue(categoryMocks);
      await controller.get(userMock, getCategoryDto);
      expect(queryExecute).toBeCalledWith(
        new FindCategoriesPaginationQuery({
          name: getCategoryDto.name,
          level: getCategoryDto.level,
          isCreatedByMe: getCategoryDto.isCreatedByMe,
          offset: getCategoryDto.offset,
          limit: getCategoryDto.limit,
        })
      );
    });
  });
});
