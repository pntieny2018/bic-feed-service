import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { APP_VERSION } from '../../../../common/constants';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClassTransformer } from 'class-transformer';
import { AuthUser, UserDto } from '../../../auth';
import { GetReactionPipe } from '../../../reaction/pipes';
import { FindReactionsQuery } from '../../application/query/find-reactions/find-reactions.query';
import { ReactionsResponseDto } from '../dto/response/reactions-response.dto';
import { ReactionResponseDto } from '../dto/response';
import { CreateReactionDto, DeleteReactionDto, GetReactionDto } from '../dto/request/reaction';
import { CreateReactionCommand } from '../../application/command/create-reaction/create-reaction.command';
import { DeleteReactionCommand } from '../../application/command/delete-reaction/delete-reaction.command';

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
    const reactions = rows.map((row) => new ReactionResponseDto(row));
    return new ReactionsResponseDto({
      list: reactions,
      latestId: total > 0 ? reactions[reactions.length - 1].id : null,
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
    @Body() createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    const { target, targetId, reactionName } = createReactionDto;
    const reaction = await this._commandBus.execute(
      new CreateReactionCommand({ target, targetId, reactionName, createdBy: user.id })
    );
    return new ReactionResponseDto(reaction);
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public async delete(
    @AuthUser() user: UserDto,
    @Body() deleteReactionDto: DeleteReactionDto
  ): Promise<void> {
    await this._commandBus.execute(new DeleteReactionCommand(deleteReactionDto));
  }
}
