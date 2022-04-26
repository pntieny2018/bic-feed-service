import { Body, Controller, Delete, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { CommonReactionService, CreateOrDeleteReactionService } from './services';
import { CreateReactionDto, DeleteReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';
import { APP_VERSION } from '../../common/constants';
import { ReactionResponseDto, ReactionsResponseDto } from './dto/response';
import { GetReactionDto } from './dto/request';
import { GetReactionPipe } from './pipes';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: APP_VERSION,
})
export class ReactionController {
  private _logger = new Logger(ReactionController.name);

  public constructor(
    private readonly _commonReactionService: CommonReactionService,
    private readonly _createOrDeleteReactionService: CreateOrDeleteReactionService
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Get reaction.' })
  @ApiOkResponse({
    description: 'Get reaction successfully',
    type: ReactionsResponseDto,
  })
  public get(
    @AuthUser() userDto: UserDto,
    @Query(GetReactionPipe) getReactionDto: GetReactionDto
  ): Promise<ReactionsResponseDto> {
    return this._commonReactionService.getReactions(getReactionDto);
  }

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: ReactionResponseDto,
  })
  @Post('/')
  public create(@AuthUser() userDto: UserDto, @Body() createReactionDto: CreateReactionDto): any {
    return this._createOrDeleteReactionService.addToQueueReaction(userDto, createReactionDto);
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public delete(@AuthUser() userDto: UserDto, @Body() deleteReactionDto: DeleteReactionDto): any {
    return this._createOrDeleteReactionService.addToQueueReaction(userDto, deleteReactionDto);
  }
}
