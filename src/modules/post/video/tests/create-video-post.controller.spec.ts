import { Test, TestingModule } from '@nestjs/testing';
import { CreateVideoPostController } from '../create-video-post.controller';

describe('CreateVideoPostController', () => {
  let controller: CreateVideoPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateVideoPostController],
    }).compile();

    controller = module.get<CreateVideoPostController>(CreateVideoPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
