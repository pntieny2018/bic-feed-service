import { Test, TestingModule } from '@nestjs/testing';
import { ReportContentController } from '../report-content.controller';

describe.skip('ReportContentController', () => {
  let controller: ReportContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportContentController],
    }).compile();

    controller = module.get<ReportContentController>(ReportContentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
