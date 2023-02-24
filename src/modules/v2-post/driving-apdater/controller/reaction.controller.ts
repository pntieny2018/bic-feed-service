import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { APP_VERSION } from '../../../../common/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { ReactionsResponseDto } from '../../../reaction/dto/response';
import { AuthUser, UserDto } from '../../../auth';
import { GetReactionPipe } from '../../../reaction/pipes';
import { GetReactionDto } from '../../../reaction/dto/request';
import { FindReactionsQuery } from '../../application/query/find-reactions/find-reactions.query';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: APP_VERSION,
})
export class ReactionController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();

  @Get('/')
  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionsResponseDto,
  })
  public async get(
    @AuthUser() _user: UserDto,
    @Query(GetReactionPipe) getReactionDto: GetReactionDto
  ): Promise<ReactionsResponseDto> {
    const { reactionName, target, targetId, latestId, order, limit } = getReactionDto;
    const { rows, total } = await this._queryBus.execute(
      new FindReactionsQuery({ reactionName, target, targetId, latestId, order, limit })
    );
    return this._classTransformer.plainToInstance(ReactionsResponseDto, { rows, total });
  }
}
