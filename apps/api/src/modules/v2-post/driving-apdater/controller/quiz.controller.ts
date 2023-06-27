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
    console.log('111111111');
    return [
      {
        question: 'What is the capital of Vietnam?',
        answers: [
          {
            answer: 'Hanoi',
            isCorrect: true,
          },
          {
            answer: 'Ho Chi Minh',
            isCorrect: false,
          },
          {
            answer: 'Da Nang',
            isCorrect: false,
          },
        ],
      },
      {
        question: 'What is purpose of life?',
        answers: [
          {
            answer: 'To be happy',
            isCorrect: true,
          },
          {
            answer: 'To be rich',
            isCorrect: false,
          },
          {
            answer: 'To be famous',
            isCorrect: false,
          },
        ],
      },
    ];
  }
}
