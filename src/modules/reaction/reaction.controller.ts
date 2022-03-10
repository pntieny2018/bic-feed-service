import { Body, Controller, Delete, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiSecurity,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ReactionService } from './reaction.service';
import { VersionController } from '../../common/controllers';
import { CreateReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
})
@ApiInternalServerErrorResponse({
  description: 'Internal Server Error',
})
@Controller('reactions')
export class ReactionController extends VersionController {
  public constructor(private readonly _reactionService: ReactionService) {
    super();
  }

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
    return this._reactionService.handleReaction(user, createReactionDto, true);
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
