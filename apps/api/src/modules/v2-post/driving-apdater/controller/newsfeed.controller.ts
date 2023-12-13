import { UserDto } from '@libs/service/user';
import { Controller, Get, Query, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser } from '../../../../common/decorators';
import { FindNewsfeedQuery } from '../../application/query/content';
import { NewsfeedRequestDto } from '../dto/request';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller()
export class NewsFeedController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get newsfeed.' })
  @Get(ROUTES.NEWSFEED.GET_LIST.PATH)
  @Version(ROUTES.NEWSFEED.GET_LIST.VERSIONS)
  public async getNewsfeed(
    @AuthUser(false) authUser: UserDto,
    @Query() dto: NewsfeedRequestDto
  ): Promise<any> {
    const { type, isSaved, isMine, isImportant, limit, before, after } = dto;

    return this._queryBus.execute(
      new FindNewsfeedQuery({
        type,
        isSaved,
        isMine,
        isImportant,
        limit,
        after,
        before,
        authUser,
      })
    );
  }
}
