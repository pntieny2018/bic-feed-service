import { UserDto } from '../../../v2-user/application';

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
  public questions?: {
    question: string;
    answers: {
      answer: string;
      isCorrect?: boolean;
    }[];
  }[];
  public createdAt: Date;
  public updatedAt: Date;
  public status: string;
  public constructor(data: Partial<QuizDto>) {
    Object.assign(this, data);
  }
}
