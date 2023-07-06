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
  public constructor(data: Partial<QuizDto>) {
    Object.assign(this, data);
  }
}
