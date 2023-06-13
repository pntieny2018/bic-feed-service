import { Controller, Get } from '@nestjs/common';
import { VERSIONS_SUPPORTED } from '../common/constants';
import { FeedPublisherService } from '../modules/feed-publisher';

@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'app',
})
export class AppController {
  public constructor(private _publisher: FeedPublisherService) {}

  @Get('health-check')
  public getHealthBeat(): string {
    return 'OK';
  }
}
