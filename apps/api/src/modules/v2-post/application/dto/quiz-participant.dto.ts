import { QuestionDto } from './question.dto';

class QuestionNotIncludeCorrectAnswerDto {
  public id: string;
  public content: string;
  public answers: {
    id: string;
    content: string;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}
export class QuizParticipantDto {
  public id: string;
  public quizId: string;
  public contentId: string;
  public timeLimit: number;
  public startedAt: Date;
  public createdAt: Date;
  public updatedAt: Date;
  public questions: QuestionNotIncludeCorrectAnswerDto[];
  public userAnswers: {
    questionId: string;
    answerId: string;
  }[];
  public score?: number;
  public totalAnswers?: number;
  public totalCorrectAnswers?: number;
  public finishedAt?: Date;
  public constructor(data: Partial<QuizParticipantDto>) {
    Object.assign(this, data);
  }
}
