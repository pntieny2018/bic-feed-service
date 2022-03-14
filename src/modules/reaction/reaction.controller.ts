import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity, ApiBadRequestResponse } from '@nestjs/swagger';
import { CreateReactionService } from './services';
import { CreateReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller('reactions')
export class ReactionController {
  public constructor(private readonly _createReactionService: CreateReactionService) {}

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: Boolean,
  })
  @Post('/')
  public async create(@AuthUser() user: UserDto, @Body() createReactionDto: CreateReactionDto): Promise<boolean> {
    return this._createReactionService.createReaction(user, createReactionDto);
  }

  @ApiOperation({ summary: 'Delete reaction.' })
  @ApiBadRequestResponse({
    description: 'Delete reaction fails',
  })
  @ApiOkResponse({
    description: 'Delete reaction successfully',
    type: Boolean,
  })
  @Delete('/')
  public async delete(@AuthUser() user: UserDto, @Body() createReactionDto: CreateReactionDto): Promise<boolean> {
    return this._reactionService.handleReaction(user, createReactionDto, false);
  }
}
