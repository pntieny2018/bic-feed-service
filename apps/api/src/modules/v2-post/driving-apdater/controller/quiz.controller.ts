import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Request } from 'express';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import {
  AddQuizQuestionCommand,
  CreateQuizCommand,
  DeleteQuizCommand,
  DeleteQuizQuestionCommand,
  GenerateQuizCommand,
  StartQuizCommand,
  UpdateQuizAnswerCommand,
  UpdateQuizCommand,
  UpdateQuizQuestionCommand,
} from '../../application/command/quiz';
import {
  FindQuizzesDto,
  QuestionDto,
  QuizDto,
  QuizParticipantDto,
  QuizSummaryDto,
} from '../../application/dto';
import {
  FindQuizParticipantQuery,
  FindQuizParticipantsSummaryDetailDto,
  FindQuizParticipantsSummaryDetailQuery,
  FindQuizQuery,
  FindQuizSummaryQuery,
  FindQuizzesQuery,
} from '../../application/query/quiz';
import { QuizStatus } from '../../data-type';
import {
  AddQuizQuestionRequestDto,
  CreateQuizRequestDto,
  GenerateQuizRequestDto,
  GetQuizParticipantsSummaryDetailRequestDto,
  GetQuizzesRequestDto,
  UpdateQuizAnswersRequestDto,
  UpdateQuizQuestionRequestDto,
  UpdateQuizRequestDto,
} from '../dto/request';

@ApiTags('Quizzes')
@ApiSecurity('authorization')
@Controller()
export class QuizController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
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
    const data = await this._queryBus.execute(
      new FindQuizzesQuery({ authUser: user, ...getQuizzesRequestDto })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Create new quiz' })
  @ApiOkResponse({
    type: QuizDto,
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
    const quiz = await this._commandBus.execute<CreateQuizCommand, QuizDto>(
      new CreateQuizCommand({ ...createQuizDto, authUser })
    );

    return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    const quiz = await this._commandBus.execute<GenerateQuizCommand, QuizDto>(
      new GenerateQuizCommand({ ...generateQuizDto, quizId, authUser })
    );

    return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    const data = await this._queryBus.execute(new FindQuizSummaryQuery({ authUser, contentId }));
    return data;
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
    const data = await this._queryBus.execute(
      new FindQuizParticipantsSummaryDetailQuery({ authUser, contentId: contentId, ...query })
    );
    return data;
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
    const quiz = await this._commandBus.execute<UpdateQuizCommand, QuizDto>(
      new UpdateQuizCommand({ ...updateQuizDto, quizId, authUser })
    );

    if (updateQuizDto.status === QuizStatus.PUBLISHED) {
      req.message = 'message.quiz.published_success';
    }

    return plainToInstance(QuizDto, quiz, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get quiz' })
  @Get(ROUTES.QUIZ.GET_QUIZ_DETAIL.PATH)
  @Version(ROUTES.QUIZ.UPDATE.VERSIONS)
  public async getQuizDetail(
    @Param('id', ParseUUIDPipe) quizId: string,
    @AuthUser() authUser: UserDto
  ): Promise<QuizDto> {
    const data = await this._queryBus.execute(new FindQuizQuery({ authUser, quizId }));
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
    await this._commandBus.execute<DeleteQuizCommand, QuizDto>(
      new DeleteQuizCommand({ quizId, authUser })
    );
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
  ): Promise<QuestionDto> {
    const data = await this._commandBus.execute<AddQuizQuestionCommand, QuestionDto>(
      new AddQuizQuestionCommand({
        quizId: id,
        content: addQuestionDto.content,
        answers: addQuestionDto.answers,
        authUser,
      })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
  ): Promise<QuestionDto> {
    const data = await this._commandBus.execute<UpdateQuizQuestionCommand, QuestionDto>(
      new UpdateQuizQuestionCommand({
        questionId,
        content: updateQuestionDto.content,
        answers: updateQuestionDto.answers,
        authUser,
      })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Delete quiz question' })
  @ResponseMessages({
    success: 'message.quiz_question.deleted_success',
  })
  @Delete(ROUTES.QUIZ.DELETE_QUIZ_QUESTION.PATH)
  @Version(ROUTES.QUIZ.DELETE_QUIZ_QUESTION.VERSIONS)
  public async deleteQuizQuestion(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    await this._commandBus.execute<DeleteQuizQuestionCommand, string>(
      new DeleteQuizQuestionCommand({
        quizId,
        questionId,
        authUser,
      })
    );
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
    const quizParticipantId = await this._commandBus.execute<StartQuizCommand, string>(
      new StartQuizCommand({ quizId, authUser })
    );
    return quizParticipantId;
  }

  @ApiOperation({ summary: 'Update quiz answers' })
  @Put(ROUTES.QUIZ.UPDATE_QUIZ_ANSWER.PATH)
  @Version(ROUTES.QUIZ.UPDATE_QUIZ_ANSWER.VERSIONS)
  public async updateQuizAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuizAnswersDto: UpdateQuizAnswersRequestDto,
    @AuthUser() authUser: UserDto
  ): Promise<void> {
    await this._commandBus.execute<UpdateQuizAnswerCommand, void>(
      new UpdateQuizAnswerCommand({
        quizParticipantId: id,
        isFinished: updateQuizAnswersDto.isFinished,
        answers: updateQuizAnswersDto.answers,
        authUser,
      })
    );
  }

  @ApiOperation({ summary: 'Get quiz result' })
  @Get(ROUTES.QUIZ.GET_QUIZ_RESULT.PATH)
  @Version(ROUTES.QUIZ.GET_QUIZ_RESULT.VERSIONS)
  public async getTakeQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthUser() authUser: UserDto
  ): Promise<QuizParticipantDto> {
    const data = await this._queryBus.execute(
      new FindQuizParticipantQuery({ authUser, quizParticipantId: id })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }
}
