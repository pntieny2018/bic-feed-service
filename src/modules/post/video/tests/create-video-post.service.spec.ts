import { Test, TestingModule } from '@nestjs/testing';
import { CreateVideoPostService } from '../create-video-post.service';

describe('CreateVideoPostService', () => {
  let service: CreateVideoPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateVideoPostService],
    }).compile();

    service = module.get<CreateVideoPostService>(CreateVideoPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
