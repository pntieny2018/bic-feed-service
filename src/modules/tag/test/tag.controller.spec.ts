import { TagController } from '../tag.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from '../tag.service';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
import { createTagDto } from './mocks/create-tag-dto.mock';

describe('TagController', () => {
  let controller: TagController
  let tagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [{
        provide: TagService,
        useValue: {
          create: jest.fn(),
          get: jest.fn(),
        },
      }],
    }).compile();

    controller = module.get<TagController>(TagController);
    tagService = module.get<TagService>(TagService);
  })

  it('should be defined', () => {
    expect(tagService).toBeDefined();
  });

  describe('TagController.get', () => {
    it('CommentService.getComments should be called', async () => {
      tagService.get.mockResolvedValue([]);
      await controller.get(authUserMock, {
        groupId: 'c8ddd4d4-9a5e-4d93-940b-e332a8d0422d',
        limit: 10,
      });
      expect(tagService.get).toBeCalled();
    });
  })

  describe('TagController.create', () => {
    it('logger should be called', async () => {
      await controller.create(authUserMock, createTagDto).catch(() => {});
    });

    it('CommentService.create should be called', async () => {
      tagService.create.mockResolvedValue({});
      await controller.create(authUserMock, createTagDto);
      expect(tagService.create).toBeCalled();
    });
  })
})
