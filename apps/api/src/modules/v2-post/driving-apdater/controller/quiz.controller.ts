import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { CreateQuizRequestDto } from '../dto/request/create-quiz.request.dto';
import { ContentNotFoundException, OpenAIException } from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateQuizCommand } from '../../application/command/create-quiz/create-quiz.command';
import { QuizDto } from '../../application/dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { QuizNoCRUDPermissionAtGroupException } from '../../domain/exception/quiz-no-crud-permission-at-group.exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { GenerateQuizCommand } from '../../application/command/generate-quiz/generate-quiz.command';
import { GenerateQuizRequestDto } from '../dto/request/generate-quiz.request.dto';
import { UpdateQuizRequestDto } from '../dto/request/update-quiz.request.dto';
import { UpdateQuizCommand } from '../../application/command/update-quiz/update-quiz.command';

@ApiTags('Quizzes')
@ApiSecurity('authorization')
@Controller()
export class QuizController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}
  private _classTransformer = new ClassTransformer();

  @ApiOperation({ summary: 'Create new quiz' })
  @ApiOkResponse({
    type: CreateTagDto,
    description: 'Create quiz successfully',
  })
  @ResponseMessages({
    success: 'message.quiz.created_success',
  })
  @Post(ROUTES.QUIZ.CREATE.PATH)
  @Version(ROUTES.QUIZ.CREATE.VERSIONS)
  public async create(
    @AuthUser() authUser: UserDto,
    @Body() createQuizDto: CreateQuizRequestDto
  ): Promise<QuizDto> {
    try {
      const quiz = await this._commandBus.execute<CreateQuizCommand, QuizDto>(
        new CreateQuizCommand({ ...createQuizDto, authUser })
      );

      return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case QuizNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case ContentEmptyException:
        case OpenAIException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Generate a quiz' })
  @ApiOkResponse({
    type: CreateTagDto,
    description: 'Regenerate quiz successfully',
  })
  @ResponseMessages({
    success: 'message.quiz.created_success',
  })
  @Put(ROUTES.QUIZ.GENERATE.PATH)
  @Version(ROUTES.QUIZ.GENERATE.VERSIONS)
  public async regenerate(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto,
    @Body() generateQuizDto: GenerateQuizRequestDto
  ): Promise<QuizDto> {
    try {
      const quiz = await this._commandBus.execute<GenerateQuizCommand, QuizDto>(
        new GenerateQuizCommand({ ...generateQuizDto, quizId, authUser })
      );

      return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case QuizNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case ContentEmptyException:
        case OpenAIException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update a quiz' })
  @ApiOkResponse({
    type: CreateTagDto,
    description: 'Update quiz successfully',
  })
  @ResponseMessages({
    success: 'message.quiz.updated_success',
  })
  @Put(ROUTES.QUIZ.UPDATE.PATH)
  @Version(ROUTES.QUIZ.UPDATE.VERSIONS)
  public async update(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto,
    @Body() updateQuizDto: UpdateQuizRequestDto
  ): Promise<QuizDto> {
    try {
      const quiz = await this._commandBus.execute<UpdateQuizCommand, QuizDto>(
        new UpdateQuizCommand({ ...updateQuizDto, quizId, authUser })
      );

      return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case QuizNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case ContentEmptyException:
        case OpenAIException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
