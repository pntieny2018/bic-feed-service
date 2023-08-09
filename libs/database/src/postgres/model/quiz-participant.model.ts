import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { PostModel } from './post.model';
import { QuizParticipantAnswerModel } from './quiz-participant-answers.model';
import { QuizModel } from './quiz.model';

export type QuizParticipantAttributes = InferAttributes<QuizParticipantModel>;

@Table({
  tableName: 'quiz_participants',
})
export class QuizParticipantModel extends Model<
  QuizParticipantAttributes,
  InferCreationAttributes<QuizParticipantModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizId: string;

  @Column
  public postId: string;

  @Column
  public score: number;

  @Column
  public timeLimit: number;

  @Column
  public totalAnswers: number;

  @Column
  public totalCorrectAnswers: number;

  @Column
  public startedAt: Date;

  @Column
  public finishedAt: Date;

  @Column({
    type: DataTypes.JSONB,
  })
  public quizSnapshot: any;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @AllowNull(false)
  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @BelongsTo(() => PostModel, {
    foreignKey: 'postId',
  })
  public post?: PostModel;

  @BelongsTo(() => QuizModel, {
    foreignKey: 'quizId',
  })
  public quiz?: QuizModel;

  @HasMany(() => QuizParticipantAnswerModel, {
    foreignKey: 'quizParticipantId',
  })
  public answers: QuizParticipantAnswerModel[];
}
