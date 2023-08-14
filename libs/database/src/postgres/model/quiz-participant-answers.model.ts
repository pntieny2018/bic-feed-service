import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

export type QuizParticipantAnswerAttributes = InferAttributes<QuizParticipantAnswerModel>;
@Table({
  tableName: 'quiz_participant_answers',
})
export class QuizParticipantAnswerModel extends Model<
  QuizParticipantAnswerAttributes,
  InferCreationAttributes<QuizParticipantAnswerModel>
> {
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
