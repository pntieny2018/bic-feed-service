import { Controller, Get, Query, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { CountContentPerWeekQuery } from '../../application/query/content';
import { CountContentPerWeekRequestDto } from '../../driving-apdater/dto/request';

@ApiTags('Internal')
@Controller()
export class InternalController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Count number content per week in community' })
  @Get(ROUTES.INTERNAL.COUNT_CONTENTS_PER_WEEK.PATH)
  @Version(ROUTES.INTERNAL.COUNT_CONTENTS_PER_WEEK.VERSIONS)
  public async countContentsPerWeek(
    @Query() query: CountContentPerWeekRequestDto
  ): Promise<Record<string, number>> {
    return this._queryBus.execute(
      new CountContentPerWeekQuery({
        rootGroupIds: query.rootGroupIds,
      })
    );
  }
}
