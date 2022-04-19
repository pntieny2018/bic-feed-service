import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { CommonReactionService, CreateReactionService, DeleteReactionService } from './services';
import { CreateReactionDto, DeleteReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';
import { APP_VERSION } from '../../common/constants';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import { GetReactionDto } from './dto/request';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: APP_VERSION,
})
export class ReactionController {
  public constructor(
    private readonly _commonReactionService: CommonReactionService,
    private readonly _createReactionService: CreateReactionService,
    private readonly _deleteReactionService: DeleteReactionService
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionsResponseDto,
  })
  public get(
    @AuthUser() userDto: UserDto,
    @Query() getReactionDto: GetReactionDto
  ): Promise<ReactionsResponseDto> {
    return this._commonReactionService.getReactions(getReactionDto);
  }

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: ReactionResponseDto,
  })
  @Post('/')
  public async create(
    @AuthUser() userDto: UserDto,
    @Body() createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    return this._createReactionService.createReaction(userDto, createReactionDto);
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public async delete(
    @AuthUser() userDto: UserDto,
    @Body() deleteReactionDto: DeleteReactionDto
  ): Promise<boolean> {
    return this._deleteReactionService.deleteReaction(userDto, deleteReactionDto);
  }
}
