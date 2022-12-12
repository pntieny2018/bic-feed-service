import { Module } from '@nestjs/common';
import { ReportContentController } from './report-content.controller';
import { ReportContentService } from './report-content.service';

@Module({
  controllers: [ReportContentController],
  providers: [ReportContentService]
})
export class ReportContentModule {}
