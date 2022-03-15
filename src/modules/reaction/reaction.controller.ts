import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { CreateReactionService } from './services';
import { CreateReactionDto } from './dto/request';
import { AuthUser, UserDto } from '../auth';
import { REACTION_SERVICE, TOPIC_REACTION_CREATED } from './reaction.constant';
import { ClientKafka } from '@nestjs/microservices';
import { CreateReactionTopicDto } from './dto/reaction-topic.dto';

@ApiTags('Reactions')
@ApiSecurity('authorization')
@Controller('reactions')
export class ReactionController {
  public constructor(
    private readonly _createReactionService: CreateReactionService,
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
    const didCreate = await this._createReactionService.createReaction(userDto, createReactionDto);
    const createReactionTopicDto = new CreateReactionTopicDto(createReactionDto, userDto.userId);
    this._clientKafka.emit(TOPIC_REACTION_CREATED, JSON.stringify(createReactionTopicDto));
    return didCreate;
  }
}
