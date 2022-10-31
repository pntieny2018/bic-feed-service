import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FeedGeneratorService {
  private readonly _logger = new Logger(FeedGeneratorService.name);
}
