import { UserDto } from '@libs/service/user';
import { Controller, Get, Param, ParseUUIDPipe, Query, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser } from '../../../../common/decorators';
import { PageDto } from '../../../../common/dto';
import { FindTimelineGroupQuery } from '../../application/query/content';
import { GetTimelineRequestDto } from '../dto/request';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller()
export class TimelineController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get(ROUTES.TIMELINE.GET_LIST_IN_GROUP.PATH)
  @Version(ROUTES.TIMELINE.GET_LIST_IN_GROUP.VERSIONS)
  public async getTimeline(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @AuthUser(false) authUser: UserDto,
    @Query() getTimelineDto: GetTimelineRequestDto
  ): Promise<any> {
    const { type, isSaved, isMine, isImportant, limit, before, after } = getTimelineDto;
    return this._queryBus.execute(
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
  }
}
