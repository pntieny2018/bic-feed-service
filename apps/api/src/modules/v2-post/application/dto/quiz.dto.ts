import { QuestionDto } from './question.dto';

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
  public status: string;
  public genStatus: string;
  public constructor(data: Partial<QuizDto>) {
    Object.assign(this, data);
  }
}
