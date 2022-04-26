import { Test, TestingModule } from '@nestjs/testing';
import { FeedGeneratorService } from '../feed-generator.service';

describe('FeedGeneratorService', () => {
  let service: FeedGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedGeneratorService],
    }).compile();

    service = module.get<FeedGeneratorService>(FeedGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
