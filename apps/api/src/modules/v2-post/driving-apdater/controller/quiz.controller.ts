import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance, plainToInstance } from 'class-transformer';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { CreateQuizRequestDto } from '../dto/request/create-quiz.request.dto';
import {
  AccessDeniedException,
  ContentHasQuizException,
  ContentNoCRUDPermissionAtGroupException,
  ContentNotFoundException,
  InvalidCursorParamsException,
  OpenAIException,
  QuizNotFoundException,
  QuizOverTimeException,
  QuizParticipantNotFoundException,
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateQuizCommand } from '../../application/command/create-quiz/create-quiz.command';
import { QuizDto, QuizSummaryDto } from '../../application/dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { QuizNoCRUDPermissionAtGroupException } from '../../domain/exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { GenerateQuizCommand } from '../../application/command/generate-quiz/generate-quiz.command';
import { GenerateQuizRequestDto } from '../dto/request/generate-quiz.request.dto';
import { UpdateQuizRequestDto } from '../dto/request/update-quiz.request.dto';
import { UpdateQuizCommand } from '../../application/command/update-quiz/update-quiz.command';
import { FindQuizzesDto } from '../../application/query/find-quizzes/find-quizzes.dto';
import { FindQuizzesQuery } from '../../application/query/find-quizzes/find-quizzes.query';
import { KafkaService } from '@app/kafka';
import { FindQuizQuery } from '../../application/query/find-quiz/find-quiz.query';
import { Request } from 'express';
import { QuizStatus } from '../../data-type';
import { DeleteQuizCommand } from '../../application/command/delete-quiz/delete-quiz.command';
import {
  AddQuizQuestionRequestDto,
  GetQuizzesRequestDto,
  UpdateQuizQuestionRequestDto,
} from '../dto/request';
import { StartQuizCommand } from '../../application/command/start-quiz/start-quiz.command';
import { UpdateQuizAnswerCommand } from '../../application/command/update-quiz-answer/update-quiz-answer.command';
import { UpdateQuizAnswersRequestDto } from '../dto/request/update-quiz-answer.request.dto';
import { FindQuizParticipantQuery } from '../../application/query/find-quiz-participant/find-quiz-participant.query';
import { QuizParticipantDto } from '../../application/dto/quiz-participant.dto';
import { QuizParticipantNotFinishedException } from '../../domain/exception/quiz-participant-not-finished.exception';
import { QuizQuestionNotFoundException } from '../../domain/exception/quiz-question-not-found.exception';
import { AddQuizQuestionCommand } from '../../application/command/add-quiz-question/add-quiz-question.command';
import { UpdateQuizQuestionCommand } from '../../application/command/update-quiz-question/update-quiz-question.command';
import { DeleteQuizQuestionCommand } from '../../application/command/delete-quiz-question/delete-quiz-question.command';
import { QuizQuestionDto } from '../../application/dto/quiz-question.dto';
import { FindQuizSummaryQuery } from '../../application/query/find-quiz-summary/find-quiz-summary.query';
import { FindQuizParticipantsSummaryDetailDto } from '../../application/query/find-quiz-participants-summary-detail/find-quiz-participants-summary-detail.dto';
import { GetQuizParticipantsSummaryDetailRequestDto } from '../dto/request/get-quiz-participants-summary-detail.request.dto';
import { FindQuizParticipantsSummaryDetailQuery } from '../../application/query/find-quiz-participants-summary-detail/find-quiz-participants-summary-detail.query';

@ApiTags('Quizzes')
@ApiSecurity('authorization')
@Controller()
export class QuizController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus,
    private readonly _kafkaService: KafkaService
  ) {}

  @ApiOperation({ summary: 'Get quizzes' })
  @ApiOkResponse({
    type: FindQuizzesDto,
  })
  @ResponseMessages({
    success: 'Get quizzes successfully',
  })
  @Get(ROUTES.QUIZ.GET_QUIZZES.PATH)
  @Version(ROUTES.QUIZ.GET_QUIZZES.VERSIONS)
  public async get(
    @AuthUser() user: UserDto,
    @Query() getQuizzesRequestDto: GetQuizzesRequestDto
  ): Promise<FindQuizzesDto> {
    try {
      const data = await this._queryBus.execute(
        new FindQuizzesQuery({ authUser: user, ...getQuizzesRequestDto })
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case InvalidCursorParamsException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

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
        case ContentHasQuizException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Generate a quiz' })
  @ApiOkResponse({
    type: QuizDto,
    description: 'Regenerate quiz successfully',
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
        case QuizNotFoundException:
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

  @ApiOperation({ summary: 'Get quiz summary' })
  @ApiOkResponse({
    type: QuizSummaryDto,
    description: 'Get quiz summary successfully',
  })
  @Get(ROUTES.QUIZ.GET_QUIZ_SUMMARY.PATH)
  @Version(ROUTES.QUIZ.GET_QUIZ_SUMMARY.VERSIONS)
  public async getQuizSummary(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @AuthUser() authUser: UserDto
  ): Promise<QuizSummaryDto> {
    try {
      const data = await this._queryBus.execute(new FindQuizSummaryQuery({ authUser, contentId }));

      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case AccessDeniedException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get quiz participants summary detail' })
  @ApiOkResponse({
    type: FindQuizParticipantsSummaryDetailDto,
    description: 'Get quiz participants summary detail successfully',
  })
  @Get(ROUTES.QUIZ.GET_QUIZ_PARTICIPANTS.PATH)
  @Version(ROUTES.QUIZ.GET_QUIZ_PARTICIPANTS.VERSIONS)
  public async getQuizParticipantsSummaryDetail(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @AuthUser() authUser: UserDto,
    @Query() query: GetQuizParticipantsSummaryDetailRequestDto
  ): Promise<FindQuizParticipantsSummaryDetailDto> {
    try {
      const data = await this._queryBus.execute(
        new FindQuizParticipantsSummaryDetailQuery({ authUser, contentId: contentId, ...query })
      );

      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case AccessDeniedException:
          throw new ForbiddenException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update a quiz' })
  @ApiOkResponse({
    type: QuizDto,
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
    @Body() updateQuizDto: UpdateQuizRequestDto,
    @Req() req: Request
  ): Promise<QuizDto> {
    try {
      const quiz = await this._commandBus.execute<UpdateQuizCommand, QuizDto>(
        new UpdateQuizCommand({ ...updateQuizDto, quizId, authUser })
      );

      if (updateQuizDto.status === QuizStatus.PUBLISHED) {
        req.message = 'message.quiz.published_success';
      }

      return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case QuizNotFoundException:
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case QuizNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case ContentEmptyException:
        case OpenAIException:
        case DomainModelException:
        case ContentHasQuizException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get quiz' })
  @Get(ROUTES.QUIZ.GET_QUIZ_DETAIL.PATH)
  @Version(ROUTES.QUIZ.UPDATE.VERSIONS)
  public async getQuizDetail(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto
  ): Promise<QuizDto> {
    try {
      const data = await this._queryBus.execute(new FindQuizQuery({ authUser, quizId }));
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case QuizNotFoundException:
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentEmptyException:
        case OpenAIException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete a quiz' })
  @ResponseMessages({
    success: 'message.quiz.deleted_success',
  })
  @Delete(ROUTES.QUIZ.DELETE.PATH)
  @Version(ROUTES.QUIZ.DELETE.VERSIONS)
  public async delete(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    try {
      await this._commandBus.execute<DeleteQuizCommand, QuizDto>(
        new DeleteQuizCommand({ quizId, authUser })
      );
    } catch (e) {
      switch (e.constructor) {
        case QuizNotFoundException:
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCRUDPermissionAtGroupException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Add quiz question' })
  @ResponseMessages({
    success: 'message.quiz_question.created_success',
  })
  @Post(ROUTES.QUIZ.ADD_QUIZ_QUESTION.PATH)
  @Version(ROUTES.QUIZ.ADD_QUIZ_QUESTION.VERSIONS)
  public async addQuizQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addQuestionDto: AddQuizQuestionRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<QuizQuestionDto> {
    try {
      const data = await this._commandBus.execute<AddQuizQuestionCommand, QuizQuestionDto>(
        new AddQuizQuestionCommand({
          quizId: id,
          content: addQuestionDto.content,
          answers: addQuestionDto.answers,
          authUser,
        })
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case QuizQuestionNotFoundException:
        case QuizNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update quiz question' })
  @ResponseMessages({
    success: 'message.quiz_question.updated_success',
  })
  @Put(ROUTES.QUIZ.UPDATE_QUIZ_QUESTION.PATH)
  @Version(ROUTES.QUIZ.UPDATE_QUIZ_QUESTION.VERSIONS)
  public async updateQuizQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() updateQuestionDto: UpdateQuizQuestionRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<QuizQuestionDto> {
    try {
      const data = await this._commandBus.execute<UpdateQuizQuestionCommand, QuizQuestionDto>(
        new UpdateQuizQuestionCommand({
          questionId,
          content: updateQuestionDto.content,
          answers: updateQuestionDto.answers,
          authUser,
        })
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case QuizQuestionNotFoundException:
        case QuizNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete quiz question' })
  @ResponseMessages({
    success: 'message.quiz_question.deleted_success',
  })
  @Delete(ROUTES.QUIZ.DELETE_QUIZ_QUESTION.PATH)
  @Version(ROUTES.QUIZ.DELETE_QUIZ_QUESTION.VERSIONS)
  public async deleteQuizQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    try {
      await this._commandBus.execute<DeleteQuizQuestionCommand, string>(
        new DeleteQuizQuestionCommand({
          questionId,
          authUser,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case QuizQuestionNotFoundException:
        case QuizNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCRUDPermissionAtGroupException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Start a quiz' })
  @ApiOkResponse({
    type: String,
    description: 'Start quiz successfully',
  })
  @Post(ROUTES.QUIZ.START_QUIZ.PATH)
  @Version(ROUTES.QUIZ.START_QUIZ.VERSIONS)
  public async startQuiz(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto
  ): Promise<string> {
    try {
      const quizParticipantId = await this._commandBus.execute<StartQuizCommand, string>(
        new StartQuizCommand({ quizId, authUser })
      );
      return quizParticipantId;
    } catch (e) {
      switch (e.constructor) {
        case QuizNotFoundException:
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCRUDPermissionAtGroupException:
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case QuizParticipantNotFinishedException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Update quiz answers' })
  @Put(ROUTES.QUIZ.UPDATE_QUIZ_ANSWER.PATH)
  @Version(ROUTES.QUIZ.UPDATE_QUIZ_ANSWER.VERSIONS)
  public async updateQuizAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuizAnswersDto: UpdateQuizAnswersRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    try {
      await this._commandBus.execute<UpdateQuizAnswerCommand, void>(
        new UpdateQuizAnswerCommand({
          quizParticipantId: id,
          isFinished: updateQuizAnswersDto.isFinished,
          answers: updateQuizAnswersDto.answers,
          authUser,
        })
      );
    } catch (e) {
      switch (e.constructor) {
        case QuizParticipantNotFoundException:
          throw new NotFoundException(e);
        case AccessDeniedException:
          throw new ForbiddenException(e);
        case QuizOverTimeException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get quiz result' })
  @Get(ROUTES.QUIZ.GET_QUIZ_RESULT.PATH)
  @Version(ROUTES.QUIZ.GET_QUIZ_RESULT.VERSIONS)
  public async getTakeQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<QuizParticipantDto> {
    try {
      const data = await this._queryBus.execute(
        new FindQuizParticipantQuery({ authUser, quizParticipantId: id })
      );
      return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case QuizParticipantNotFoundException:
          throw new NotFoundException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
