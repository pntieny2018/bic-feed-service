import { Controller, Get } from '@nestjs/common';
import { GenericApiOkResponse } from '../../common/decorators';

@Controller({
  path: 'feed',
  version: '1',
})
export class FeedController {
  @Get()
  @GenericApiOkResponse(String)
  public getNewsFeed(): string {
    return null;
  }
}
