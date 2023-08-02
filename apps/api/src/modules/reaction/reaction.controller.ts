import { GetReactionPipe } from './pipes';
import { CreateReactionDto, DeleteReactionDto, GetReactionDto } from './dto/request';
import { ReactionService } from './reaction.service';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { IPostReaction } from '../../database/models/post-reaction.model';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import { ICommentReaction } from '../../database/models/comment-reaction.model';
import { Body, Controller, Delete, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserDto } from '../v2-user/application';
import { AuthUser } from '../../common/decorators';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: VERSIONS_SUPPORTED,
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
