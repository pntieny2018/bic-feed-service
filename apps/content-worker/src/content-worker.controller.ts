import { Controller, Get } from '@nestjs/common';
import { ContentWorkerService } from './content-worker.service';

@Controller()
export class ContentWorkerController {
  constructor(private readonly contentWorkerService: ContentWorkerService) {}

  @Get()
  getHello(): string {
    return this.contentWorkerService.getHello();
  }
}
