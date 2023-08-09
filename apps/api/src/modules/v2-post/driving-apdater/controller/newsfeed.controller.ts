import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserDto } from '../../../v2-user/application';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { NewsfeedRequestDto } from '../dto/request';
import { FindNewsfeedQuery } from '../../application/query/find-newsfeed/find-newsfeed.query';
import { AuthUser } from '../../../../common/decorators';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller({
  path: 'newsfeed',
  version: VERSIONS_SUPPORTED,
})
export class NewsFeedController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get newsfeed.' })
  @Get('/')
  public async getNewsfeed(
    @AuthUser(false) authUser: UserDto,
    @Query() dto: NewsfeedRequestDto
  ): Promise<any> {
    const { type, isSaved, isMine, isImportant, limit, before, after } = dto;
    const data = await this._queryBus.execute(
      new FindNewsfeedQuery({
        type,
        isSaved,
        isMine,
        isImportant,
        limit: limit,
        after,
        before,
        authUser,
      })
    );
    return data;
  }
}
