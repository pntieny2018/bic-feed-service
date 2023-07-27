import {
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export interface IQuizParticipantAnswer {
  id: string;
  quizParticipantId: string;
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'quiz_participant_answers',
})
export class QuizParticipantAnswerModel
  extends Model<IQuizParticipantAnswer, Optional<IQuizParticipantAnswer, 'id'>>
  implements IQuizParticipantAnswer
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizParticipantId: string;

  @Column
  public questionId: string;

  @Column
  public answerId: string;

  @Column
  public isCorrect: boolean;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
