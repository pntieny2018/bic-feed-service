import { QUIZ_PROCESS_STATUS, QUIZ_RESULT_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { IPaginatedInfo, PaginatedResponse } from '../../../../common/dto';
import { UserDto } from '../../../v2-user/application';
import { QuizGenStatus, QuizStatus } from '../../data-type';

import { ArticleDto } from './article.dto';
import { PostDto } from './post.dto';
import { SeriesDto } from './series.dto';

export class QuizDto {
  public id: string;
  public contentId: string;
  public numberOfQuestions: number;
  public numberOfAnswers: number;
  public isRandom: boolean;
  public title: string;
  public description?: string;
  public numberOfQuestionsDisplay?: number;
  public questions?: QuestionDto[];
  public createdAt: Date;
  public updatedAt: Date;
  public status: QuizStatus | QUIZ_STATUS;
  public genStatus: QuizGenStatus | QUIZ_PROCESS_STATUS;
  public error?: {
    code: string;
    message: string;
  };
  public constructor(data: Partial<QuizDto>) {
    Object.assign(this, data);
  }
}

export class QuestionDto {
  public id: string;
  public content: string;
  public answers: {
    id: string;
    content: string;
    isCorrect?: boolean;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}

export class AnswerUserDto {
  @ApiProperty({ type: String })
  @IsUUID()
  @IsOptional()
  public id?: string;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  @Expose({ name: 'question_id' })
  public questionId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  @IsNotEmpty()
  @Expose({ name: 'answer_id' })
  public answerId: string;

  public constructor(data: AnswerUserDto) {
    Object.assign(this, data);
  }
}

export class QuizParticipantDto {
  public id: string;
  public quizId: string;
  public content?: {
    id: string;
    type: string;
  };
  public title: string;
  public description: string;
  public timeLimit: number;
  public startedAt: Date;
  public createdAt: Date;
  public updatedAt: Date;
  public questions: QuestionDto[];
  public userAnswers: {
    questionId: string;
    answerId: string;
  }[];
  public score?: number;
  public totalAnswers?: number;
  public totalCorrectAnswers?: number;
  public finishedAt?: Date;
  public totalTimes?: number;
  public constructor(data: Partial<QuizParticipantDto>) {
    Object.assign(this, data);
  }
}

export class QuizParticipantSummaryDto {
  public total: number;
  public pass: number;
  public fail: number;

  public constructor(data: Partial<QuizParticipantSummaryDto>) {
    Object.assign(this, data);
  }
}

export class QuizSummaryDto {
  public contentId: string;
  public participants: QuizParticipantSummaryDto;

  public constructor(data: Partial<QuizSummaryDto>) {
    Object.assign(this, data);
  }
}

export class QuizParticipantSummaryDetailDto extends PickType(QuizParticipantDto, [
  'id',
  'quizId',
  'createdAt',
  'score',
]) {
  public status: QUIZ_RESULT_STATUS;
  public actor: UserDto;

  public constructor(data: Partial<QuizParticipantSummaryDetailDto>) {
    super(data);
  }
}

export class FindQuizzesDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
