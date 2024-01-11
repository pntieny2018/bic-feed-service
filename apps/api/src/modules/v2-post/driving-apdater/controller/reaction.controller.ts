import { UserDto } from '@libs/service/user';
import { Body, Controller, Delete, Get, Post, Query, Version } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser } from '../../../../common/decorators';
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
@Controller()
export class ReactionController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionListDto,
  })
  @Version(ROUTES.REACTION.GET_LIST.VERSIONS)
  @Get(ROUTES.REACTION.GET_LIST.PATH)
  public async getReactions(
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
    type: ReactionDto,
    description: 'Create reaction successfully',
  })
  @Version(ROUTES.REACTION.CREATE.VERSIONS)
  @Post(ROUTES.REACTION.CREATE.PATH)
  public async createReaction(
    @AuthUser() user: UserDto,
    @Body() createReactionDto: CreateReactionRequestDto
  ): Promise<ReactionDto> {
    const { target, targetId, reactionName } = createReactionDto;
    const reactionDto = this._commandBus.execute(
      new CreateReactionCommand({ target, targetId, reactionName, authUser: user })
    );

    return instanceToInstance(reactionDto, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Version(ROUTES.REACTION.DELETE.VERSIONS)
  @Delete(ROUTES.REACTION.DELETE.PATH)
  public async deleteReaction(
    @AuthUser() user: UserDto,
    @Body() deleteReactionDto: DeleteReactionRequestDto
  ): Promise<void> {
    return this._commandBus.execute(
      new DeleteReactionCommand({ ...deleteReactionDto, userId: user.id })
    );
  }
}
