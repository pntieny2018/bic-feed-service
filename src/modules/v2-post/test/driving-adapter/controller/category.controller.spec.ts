import { CategoryController } from '../../../driving-apdater/controller/category.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { userMock } from '../../mock/user.dto.mock';

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

  const categoryMocks = [
    {
      "id": "6b9fbc18-04c3-4a4a-bd64-453add6724dd",
      "name": "Outdoors",
      "slug": "outdoors",
      "createdAt": "2022-09-21T08:33:18.881Z"
    },
    {
      "id": "ce8c7613-426d-48e4-8d74-c2a12adc05f9",
      "name": "Fashion & Beauty",
      "slug": "fashion-beauty",
      "createdAt": "2022-09-21T08:33:18.881Z"
    }
  ]

  describe('Get', () => {

    it('Should get categories successfully', async () => {
      jest.spyOn(query, 'execute').mockResolvedValue({ rows: categoryMocks, total: 0 });
      const result = await controller.get(userMock, {});
      expect(result).toEqual({
        list: [
          {
            "id": "6b9fbc18-04c3-4a4a-bd64-453add6724dd",
            "name": "Outdoors",
            "slug": "outdoors",
            "createdAt": "2022-09-21T08:33:18.881Z",
          },
          {
            "id": "ce8c7613-426d-48e4-8d74-c2a12adc05f9",
            "name": "Fashion & Beauty",
            "slug": "fashion-beauty",
            "createdAt": "2022-09-21T08:33:18.881Z",
          }
        ],
        "meta": {
          "hasNextPage": false,
          "total": 0
        }
      });
    });
  });
});
