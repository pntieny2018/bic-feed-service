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

  @ApiOperation({ summary: 'Get timeline in a group.' })
  @ApiOkResponse({
    description: 'Get timeline in a group successfully.',
    type: PageDto,
  })
  @Get('/send')
  public async sendMessage(
    @AuthUser(false) authUser: UserDto,
    @Query() dto: GetNewsfeedRequestDto
  ): Promise<any> {
    this._kafka.emit('dang_test', {
      test: 'test',
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-US'),
    });
  }

  @EventPattern('dang_test')
  public async consum(@Payload('value') payload: PostChangedMessagePayload): Promise<any> {
    console.log('payload', payload);

    await new Promise((r) => setTimeout(r, 1 * 60000));

    console.log('done message');
  }

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
