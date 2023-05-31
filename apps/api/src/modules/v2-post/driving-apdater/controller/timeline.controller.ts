import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { DEFAULT_APP_VERSION } from '../../../../common/constants';
import { MarkReadImportantContentCommand } from '../../application/command/mark-read-important-content/mark-read-important-content.command';
import { ValidateSeriesTagsCommand } from '../../application/command/validate-series-tags/validate-series-tag.command';
import { ValidateSeriesTagDto } from '../dto/request';
import { PageDto } from '../../../../common/dto';
import { GetTimelineDto } from '../../../feed/dto/request';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller({
  path: 'timeline',
  version: DEFAULT_APP_VERSION,
})
export class ContentController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/timeline')
  public async getTimeline(
    @AuthUser(false) authUser: UserDto,
    @Query() getTimelineDto: GetTimelineDto
  ): Promise<any> {
    // return this._feedService.getTimeline(authUser, getTimelineDto);
  }
}
