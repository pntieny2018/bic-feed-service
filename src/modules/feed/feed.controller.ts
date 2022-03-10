import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get, Logger } from '@nestjs/common';
import { APP_VERSION } from '../../common/constants';
import { GenericApiOkResponse, ResponseMessages } from '../../common/decorators';

@ApiTags('Feeds')
@ApiSecurity('authorization')
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
@ApiInternalServerErrorResponse({
  description: 'Internal Server Error',
})
@ApiForbiddenResponse({
  description: 'Forbidden',
})
@Controller({
  path: 'feeds',
  version: APP_VERSION,
})
export class FeedController {
  protected logger = new Logger(FeedController.name);

  @Get('/newsfeed')
  @GenericApiOkResponse(String, 'Get newsfeed successfully')
  @ResponseMessages({
    success: 'Get newsfeed successfully',
  })
  public getNewsFeed(): string {
    return '10';
  }
}
