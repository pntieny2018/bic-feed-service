import { QuestionDto } from './question.dto';
import { QuizGenStatus, QuizStatus } from '../../data-type';

export class QuizDto {
  public id: string;
  public contentId: string;
  public numberOfQuestions: number;
  public numberOfAnswers: number;
  public isRandom: boolean;
  public title: string;
  public description?: string;
  public numberOfQuestionsDisplay?: number;
  public numberOfAnswersDisplay?: number;
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
