import { ApiProperty } from '@nestjs/swagger';
import { QuestionDto } from './question.dto';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

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
