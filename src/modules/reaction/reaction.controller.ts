import { GetReactionPipe } from './pipes';
import { AuthUser, UserDto } from '../auth';
import { CreateReactionDto, DeleteReactionDto, GetReactionDto } from './dto/request';
import { ReactionService } from './reaction.service';
import { APP_VERSION } from '../../common/constants';
import { IPostReaction } from '../../database/models/post-reaction.model';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import { ICommentReaction } from '../../database/models/comment-reaction.model';
import { Body, Controller, Delete, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: APP_VERSION,
})
export class ReactionController {
  private _logger = new Logger(ReactionController.name);

  public constructor(private readonly _reactionService: ReactionService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionsResponseDto,
  })
  public gets(
    @AuthUser() userDto: UserDto,
    @Query(GetReactionPipe) getReactionDto: GetReactionDto
  ): Promise<ReactionsResponseDto> {
    this._logger.debug(`[Get reaction]`);
    return this._reactionService.gets(getReactionDto);
  }

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: ReactionResponseDto,
  })
  @Post('/')
  public create(
    @AuthUser() userDto: UserDto,
    @Body() createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    return this._reactionService.create(userDto, createReactionDto);
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public delete(
    @AuthUser() userDto: UserDto,
    @Body() deleteReactionDto: DeleteReactionDto
  ): Promise<IPostReaction | ICommentReaction> {
    return this._reactionService.delete(userDto, deleteReactionDto);
  }
}
