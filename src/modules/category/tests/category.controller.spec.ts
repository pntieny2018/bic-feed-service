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
          createCategory: jest.fn(),
          getCategory: jest.fn(),
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
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.get(authUserMock, {
        limit: 10,
      });
      expect(logSpy).toBeCalled();
    });

    it('CommentService.getComments should be called', async () => {
      categoryService.getCategory.mockResolvedValue([]);
      await controller.get(authUserMock, {
        limit: 10,
      });
      expect(categoryService.getCategory).toBeCalled();
    });
  })

  describe('CategoryController.create', () => {
    it('logger should be called', async () => {
      const logSpy = jest.spyOn(controller['_logger'], 'debug').mockReturnThis();
      await controller.create(authUserMock, createCategoryDto).catch(() => {});
      expect(logSpy).toBeCalled();
    });

    it('CommentService.create should be called', async () => {
      categoryService.createCategory.mockResolvedValue({});
      await controller.create(authUserMock, createCategoryDto);
      expect(categoryService.createCategory).toBeCalled();
    });
  })
})
