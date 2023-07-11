import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../../../auth';
import { UserDto } from '../../../v2-user/application';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { GetNewsfeedRequestDto } from '../dto/request';
import { PageDto } from '../../../../common/dto';
import { FindNewsfeedQuery } from '../../application/query/find-newsfeed/find-newsfeed.query';
import { KafkaService } from '@app/kafka';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PostChangedMessagePayload } from '../../application/dto/message';

@ApiTags('v2 Timeline')
@ApiSecurity('authorization')
@Controller({
  path: 'newsfeed',
  version: VERSIONS_SUPPORTED,
})
export class NewsFeedController {
  public constructor(private readonly _queryBus: QueryBus, private readonly _kafka: KafkaService) {}

  @ApiOperation({ summary: 'Get newsfeed.' })
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
        limit: limit,
        after,
        before,
        authUser,
      })
    );
    return data;
  }
}
