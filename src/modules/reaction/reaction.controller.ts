import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity, ApiBadRequestResponse } from '@nestjs/swagger';
import { ReactionService } from './reaction.service';
import { CreateReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller('reactions')
export class ReactionController {
  public constructor(private readonly _reactionService: ReactionService) {}

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiBadRequestResponse({
    description: 'Create reaction fails',
  })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: Boolean,
  })
  @Post('/')
  public async create(@AuthUser() user: UserDto, @Body() createReactionDto: CreateReactionDto): Promise<boolean> {
    return this._reactionService.createReaction(user, createReactionDto);
  }
}
