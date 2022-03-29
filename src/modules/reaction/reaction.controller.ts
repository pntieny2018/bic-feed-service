import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { CreateReactionService, DeleteReactionService } from './services';
import { CreateReactionDto, DeleteReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';
import { APP_VERSION } from '../../common/constants';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller({
  path: 'reactions',
  version: APP_VERSION,
})
export class ReactionController {
  public constructor(
    private readonly _createReactionService: CreateReactionService,
    private readonly _deleteReactionService: DeleteReactionService
  ) {}

  @ApiOperation({ summary: 'Create reaction.' })
  @ApiOkResponse({
    description: 'Create reaction successfully',
    type: Boolean,
  })
  @Post('/')
  public async create(
    @AuthUser() userDto: UserDto,
    @Body() createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    await this._createReactionService.createReaction(userDto, createReactionDto);
    return true;
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
