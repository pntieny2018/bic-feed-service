import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetReactionPipe } from '../pipes/get-reaction.pipe';
import { FindReactionsQuery } from '../../application/query/find-reactions/find-reactions.query';
import { CreateReactionCommand } from '../../application/command/create-reaction/create-reaction.command';
import { DeleteReactionCommand } from '../../application/command/delete-reaction/delete-reaction.command';
import { UserDto } from '../../../v2-user/application';
import { AuthUser } from '../../../auth';
import { ReactionResponseDto } from '../../../reaction/dto/response';
import {
  CreateReactionRequestDto,
  DeleteReactionRequestDto,
  GetReactionRequestDto,
} from '../dto/request';
import { ReactionListDto } from '../../application/dto';
import { ReactionDto } from '../../../reaction/dto/reaction.dto';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';

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
    @AuthUser() authUser: UserDto,
    @Query(GetReactionPipe) getReactionDto: GetReactionRequestDto
  ): Promise<ReactionListDto> {
    const { reactionName, target, targetId, latestId, order, limit } = getReactionDto;
    const { rows, total } = await this._queryBus.execute(
      new FindReactionsQuery({
        authUser,
        reactionName,
        target,
        targetId,
        latestId,
        order,
        limit,
      })
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
    type: ReactionResponseDto,
    description: 'Create reaction successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body() createReactionDto: CreateReactionRequestDto
  ): Promise<ReactionDto> {
    const { target, targetId, reactionName } = createReactionDto;
    const reaction = await this._commandBus.execute(
      new CreateReactionCommand({ target, targetId, reactionName, createdBy: user.id })
    );
    return reaction;
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
