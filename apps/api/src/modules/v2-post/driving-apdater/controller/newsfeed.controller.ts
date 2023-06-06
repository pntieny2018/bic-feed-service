import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { DEFAULT_APP_VERSION } from '../../../../common/constants';
import { GetNewsfeedRequestDto } from '../dto/request';
import { PageDto } from '../../../../common/dto';
import { FindNewsfeedQuery } from '../../application/query/find-newsfeed/find-newsfeed.query';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller({
  path: 'newsfeed',
  version: DEFAULT_APP_VERSION,
})
export class NewsFeedController {
  public constructor(private readonly _queryBus: QueryBus) {}

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/')
  public async getNewsfeed(
    @AuthUser(false) authUser: UserDto,
    @Query() dto: GetNewsfeedRequestDto
  ): Promise<any> {
    const { type, isSaved, isMine, isImportant, limit, before, after } = dto;
    const data = await this._queryBus.execute(
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
    return data;
  }
}
