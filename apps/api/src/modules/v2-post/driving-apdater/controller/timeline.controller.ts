import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { GetTimelineRequestDto } from '../dto/request';
import { PageDto } from '../../../../common/dto';
import { FindTimelineGroupQuery } from '../../application/query/find-timeline-group/find-timeline-group.query';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller({
  path: 'timeline',
  version: VERSIONS_SUPPORTED,
})
export class TimelineController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/:groupId')
  public async getTimeline(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @AuthUser(false) authUser: UserDto,
    @Query() getTimelineDto: GetTimelineRequestDto
  ): Promise<any> {
    const { type, isSaved, isMine, isImportant, limit, before, after } = getTimelineDto;
    const data = await this._queryBus.execute(
      new FindTimelineGroupQuery({
        type,
        isSaved,
        isMine,
        isImportant,
        limit,
        groupId,
        after,
        before,
        authUser,
      })
    );
    return data;
  }
}
