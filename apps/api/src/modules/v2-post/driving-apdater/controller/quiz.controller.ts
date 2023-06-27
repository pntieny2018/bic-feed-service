import { Body, Controller, Post, Version } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ClassTransformer } from 'class-transformer';
import { ResponseMessages } from '../../../../common/decorators';
import { AuthUser } from '../../../auth';
import { CreateTagDto } from '../../../tag/dto/requests/create-tag.dto';
import { UserDto } from '../../../v2-user/application';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { CreateQuizRequestDto } from '../dto/request/create-quiz.request.dto';

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
    @AuthUser() user: UserDto,
    @Body() createQuizDto: CreateQuizRequestDto
  ): Promise<any> {
    return {
      id: 'ef541ba5-7b39-43fa-9cfd-a5289a78d82f',
      content_id: 'ef541ba5-7b39-43fa-9cfd-a5289a78d82f',
      title: 'title',
      description: 'description',
      number_of_questions: 50,
      number_of_answers: 3,
      number_of_questions_display: 12,
      number_of_answers_display: 4,
      is_random: true,
      questions: [
        {
          question: 'What is the capital of Vietnam?',
          answers: [
            {
              answer: 'Hanoi',
              is_correct: true,
            },
            {
              answer: 'Ho Chi Minh',
              is_correct: false,
            },
            {
              answer: 'Da Nang',
              is_correct: false,
            },
          ],
        },
        {
          question: 'What is purpose of life?',
          answers: [
            {
              answer: 'To be happy',
              is_correct: true,
            },
            {
              answer: 'To be rich',
              is_correct: false,
            },
            {
              answer: 'To be famous',
              is_correct: false,
            },
          ],
        },
      ],
    };
  }
}
