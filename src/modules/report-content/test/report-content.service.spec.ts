import { Test, TestingModule } from '@nestjs/testing';
import { ReportContentService } from '../report-content.service';

describe.skip('ReportContentService', () => {
  let service: ReportContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportContentService],
    }).compile();

    service = module.get<ReportContentService>(ReportContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
