import { Test, TestingModule } from '@nestjs/testing';
import { FeedPublisherService } from '../feed-publisher.service';

describe('FeedPublisherService', () => {
  let service: FeedPublisherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedPublisherService],
    }).compile();

    service = module.get<FeedPublisherService>(FeedPublisherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
