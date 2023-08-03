import { QuizGenStatus, QuizStatus } from '../../data-type';
import { IPaginatedInfo, PaginatedResponse } from '../../../../common/dto';
import { PostDto } from './post.dto';
import { ArticleDto } from './article.dto';
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
  public totalTimes?: number;
  public constructor(data: Partial<QuizParticipantDto>) {
    Object.assign(this, data);
  }
}

export class QuestionDto {
  public id: string;
  public content: string;
  public answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}

export class FindQuizzesDto extends PaginatedResponse<PostDto | ArticleDto | SeriesDto> {
  public constructor(list: (PostDto | ArticleDto | SeriesDto)[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
