import { CategoryController } from '../category.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { createCategoryDto } from './mocks/create-category-dto.mock';

describe('CategoryController', () => {
  let controller: CategoryController
  let categoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{
        provide: CategoryService,
        useValue: {
          create: jest.fn(),
          get: jest.fn(),
        },
      }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    categoryService = module.get<CategoryService>(CategoryService);
  })

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('CategoryController.get', () => {
    it('CommentService.getComments should be called', async () => {
      categoryService.get.mockResolvedValue([]);
      await controller.get(authUserMock, {
        limit: 10,
      });
      expect(categoryService.get).toBeCalled();
    });
  })

  describe('CategoryController.create', () => {
    it('CommentService.create should be called', async () => {
      categoryService.create.mockResolvedValue({});
      await controller.create(authUserMock, createCategoryDto);
      expect(categoryService.create).toBeCalled();
    });
  })
})
