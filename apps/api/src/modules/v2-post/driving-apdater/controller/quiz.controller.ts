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
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { CreateQuizRequestDto } from '../dto/request/create-quiz.request.dto';
import { CreateQuizCommand } from '../../application/command/create-quiz/create-quiz.command';
import { QuizDto } from '../../application/dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
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
import { GetQuizzesRequestDto } from '../dto/request';
import { StartQuizCommand } from '../../application/command/start-quiz/start-quiz.command';
import { UpdateQuizAnswerCommand } from '../../application/command/update-quiz-answer/update-quiz-answer.command';
import { UpdateQuizAnswersRequestDto } from '../dto/request/update-quiz-answer.request.dto';
import { FindQuizParticipantQuery } from '../../application/query/find-quiz-participant/find-quiz-participant.query';
import { QuizParticipantDto } from '../../application/dto/quiz-participant.dto';

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
    const data = await this._queryBus.execute(
      new FindQuizzesQuery({ authUser: user, ...getQuizzesRequestDto })
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
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
