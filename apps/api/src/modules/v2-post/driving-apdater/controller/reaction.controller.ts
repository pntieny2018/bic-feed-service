import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { AuthUser } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application';
import { CreateReactionCommand, DeleteReactionCommand } from '../../application/command/reaction';
import { ReactionDto, ReactionListDto } from '../../application/dto';
import { FindReactionsQuery } from '../../application/query/reaction';
import {
  CreateReactionRequestDto,
  DeleteReactionRequestDto,
  GetReactionRequestDto,
} from '../dto/request';
import { GetReactionPipe } from '../pipes/get-reaction.pipe';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: VERSIONS_SUPPORTED,
})
export class ReactionController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionListDto,
  })
  public async get(
    @AuthUser() _user: UserDto,
    @Query(GetReactionPipe) getReactionDto: GetReactionRequestDto
  ): Promise<ReactionListDto> {
    const { reactionName, target, targetId, latestId, order, limit } = getReactionDto;
    const { rows, total } = await this._queryBus.execute(
      new FindReactionsQuery({ reactionName, target, targetId, latestId, order, limit })
    );
    return new ReactionListDto({
      list: rows,
      latestId: total > 0 ? rows[rows.length - 1].id : null,
      limit,
      order,
    });
  }

  @ApiOperation({ summary: 'Create new reaction' })
  @ApiOkResponse({
    type: ReactionDto,
    description: 'Create reaction successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createReactionDto: CreateReactionRequestDto
  ): Promise<ReactionDto> {
    const { target, targetId, reactionName } = createReactionDto;
    return this._commandBus.execute(
      new CreateReactionCommand({ target, targetId, reactionName, createdBy: user.id })
    );
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public async delete(
    @AuthUser() user: UserDto,
    @Body() deleteReactionDto: DeleteReactionRequestDto
  ): Promise<void> {
    await this._commandBus.execute(
      new DeleteReactionCommand({ ...deleteReactionDto, userId: user.id })
    );
  }
}
