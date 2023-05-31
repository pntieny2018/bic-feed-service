import { Module } from '@nestjs/common';
import { ContentWorkerController } from './content-worker.controller';
import { ContentWorkerService } from './content-worker.service';

@Module({
  imports: [],
  controllers: [ContentWorkerController],
  providers: [ContentWorkerService],
})
export class ContentWorkerModule {}
