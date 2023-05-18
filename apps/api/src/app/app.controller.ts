import { Controller, Get } from '@nestjs/common';
import { DEFAULT_APP_VERSION } from '../common/constants';
import { FeedPublisherService } from '../modules/feed-publisher';

@Controller({
  version: DEFAULT_APP_VERSION,
  path: 'app',
})
export class AppController {
  public constructor(private _publisher: FeedPublisherService) {}

  @Get('health-check')
  public getHealthBeat(): string {
    return 'OK';
  }
}
