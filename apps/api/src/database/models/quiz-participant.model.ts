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
import { DataTypes, Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IPost, PostModel } from './post.model';
import { IQuiz, QuizModel } from './quiz.model';
import {
  IQuizParticipantAnswer,
  QuizParticipantAnswerModel,
} from './quiz-participant-answers.model';

export interface IQuizParticipant {
  id: string;
  quizId: string;
  postId: string;
  timeLimit: number;
  score: number;
  isHighest: boolean;
  totalAnswers: number;
  totalCorrectAnswers: number;
  startedAt: Date;
  finishedAt: Date;
  quizSnapshot: {
    title: string;
    description: string;
    questions: {
      id: string;
      content: string;
      answers: {
        id: string;
        content: string;
        isCorrect: boolean;
      }[];
    }[];
  };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  post?: IPost;
  quiz?: IQuiz;
  answers?: IQuizParticipantAnswer[];
}

@Table({
  tableName: 'quiz_participants',
})
export class QuizParticipantModel
  extends Model<IQuizParticipant, Optional<IQuizParticipant, 'id'>>
  implements IQuizParticipant
{
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

  @Default(false)
  @Column
  public isHighest: boolean;

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
  public post?: IPost;

  @BelongsTo(() => QuizModel, {
    foreignKey: 'quizId',
  })
  public quiz?: IQuiz;

  @HasMany(() => QuizParticipantAnswerModel, {
    foreignKey: 'quizParticipantId',
  })
  public answers: IQuizParticipantAnswer[];
}
