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
} from '../../domain/exception';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { CreateQuizCommand } from '../../application/command/create-quiz/create-quiz.command';
import { QuizDto } from '../../application/dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { QuizNoCRUDPermissionAtGroupException } from '../../domain/exception';
import { ContentEmptyException } from '../../domain/exception/content-empty.exception';
import { GenerateQuizCommand } from '../../application/command/generate-quiz/generate-quiz.command';
import { GenerateQuizRequestDto } from '../dto/request/generate-quiz.request.dto';
import { UpdateQuizRequestDto } from '../dto/request/update-quiz.request.dto';
import { UpdateQuizCommand } from '../../application/command/update-quiz/update-quiz.command';
import { GetDraftQuizzesDto } from '../dto/request';
import { FindDraftQuizzesDto } from '../../application/query/find-draft-quizzes/find-draft-quizzes.dto';
import { FindDraftQuizzesQuery } from '../../application/query/find-draft-quizzes/find-draft-quizzes.query';
import { KafkaService } from '@app/kafka';
import { FindQuizQuery } from '../../application/query/find-quiz/find-quiz.query';
import { Request } from 'express';
import { QuizStatus } from '../../data-type';
import { DeleteQuizCommand } from '../../application/command/delete-quiz/delete-quiz.command';

@ApiTags('Quizzes')
@ApiSecurity('authorization')
@Controller()
export class QuizController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus,
    private readonly _kafkaService: KafkaService
  ) {}

  @ApiOperation({ summary: 'Get draft quiz' })
  @ApiOkResponse({
    type: FindDraftQuizzesDto,
  })
  @ResponseMessages({
    success: 'Get draft quizzes successfully',
  })
  @Get(ROUTES.QUIZ.GET_DRAFT.PATH)
  @Version(ROUTES.QUIZ.GET_DRAFT.VERSIONS)
  public async getDraft(
    @AuthUser() user: UserDto,
    @Query() getDraftQuizzesDto: GetDraftQuizzesDto
  ): Promise<FindDraftQuizzesDto> {
    try {
      const data = await this._queryBus.execute(
        new FindDraftQuizzesQuery({ authUser: user, ...getDraftQuizzesDto })
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
    type: CreateTagDto,
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
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiOkResponse({
    type: CreateTagDto,
    description: 'Delete quiz successfully',
  })
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
        default:
          throw e;
      }
    }
  }
}
