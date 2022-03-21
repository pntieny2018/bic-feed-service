import { Body, Controller, Delete, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { CreateReactionService, DeleteReactionService } from './services';
import { CreateReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';
import {
  REACTION_SERVICE,
  TOPIC_REACTION_CREATED,
  TOPIC_REACTION_DELETED,
} from './reaction.constant';
import { ClientKafka } from '@nestjs/microservices';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller('reactions')
export class ReactionController {
  public constructor(
    private readonly _createReactionService: CreateReactionService,
    private readonly _deleteReactionService: DeleteReactionService,
    @Inject(REACTION_SERVICE) private readonly _clientKafka: ClientKafka
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
    const reactionDto = await this._createReactionService.createReaction(
      userDto,
      createReactionDto
    );
    this._clientKafka.emit(TOPIC_REACTION_CREATED, JSON.stringify(reactionDto));
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
    @Body() createReactionDto: CreateReactionDto
  ): Promise<boolean> {
    const reactionDto = await this._deleteReactionService.deleteReaction(
      userDto,
      createReactionDto
    );
    this._clientKafka.emit(TOPIC_REACTION_DELETED, JSON.stringify(reactionDto));
    return true;
  }
}
