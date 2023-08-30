import { QuestionDto } from './question.dto';
import { PickType } from '@nestjs/swagger';
import { QUIZ_RESULT_STATUS } from '@beincom/constants';
import { UserDto } from '../../../v2-user/application';
import { QuizGenStatus, QuizStatus } from '../../data-type';
import { QuizParticipantDto } from './quiz-participant.dto';

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
  public status: QuizStatus;
  public genStatus: QuizGenStatus;
  public error?: {
    code: string;
    message: string;
  };
  public constructor(data: Partial<QuizDto>) {
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
