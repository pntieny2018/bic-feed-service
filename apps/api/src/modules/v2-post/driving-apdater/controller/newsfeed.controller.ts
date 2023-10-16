import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY, VERSIONS_SUPPORTED } from '../../../../common/constants';
import { AuthUser } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application';
import { FindNewsfeedQuery } from '../../application/query/content';
import { NewsfeedRequestDto } from '../dto/request';

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
        limit,
        after,
        before,
        authUser,
      })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }
}
