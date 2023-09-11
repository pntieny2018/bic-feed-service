import { ILibQuizRepository, LIB_QUIZ_REPOSITORY_TOKEN } from '@libs/database/postgres';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { CursorPaginationResult } from '../../../../common/types';
import { QuizAnswerModel } from '../../../../database/models/quiz-answer.model';
import { QuizQuestionModel } from '../../../../database/models/quiz-question.model';
import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';
import {
  FindAllQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizQuestionMapper } from '../mapper/quiz-question.mapper';
import { QuizMapper } from '../mapper/quiz.mapper';

export class QuizRepository implements IQuizRepository {
  public constructor(
    @Inject(LIB_QUIZ_REPOSITORY_TOKEN)
    private readonly _libQuizRepo: ILibQuizRepository,

    private readonly _quizQuestionMapper: QuizQuestionMapper,

    private readonly _quizMapper: QuizMapper,

    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,
    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel
  ) {}

  public async createQuiz(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.createQuiz(model);
  }
  public async updateQuiz(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.updateQuiz(quizEntity.get('id'), model);
  }

  public async deleteQuiz(id: string): Promise<void> {
    await this._libQuizRepo.deleteQuiz({
      id,
    });
  }

  public async findQuizById(quizId: string): Promise<QuizEntity> {
    const model = await this._libQuizRepo.findQuiz({
      condition: { ids: [quizId] },
    });
    return this._quizMapper.toDomain(model);
  }

  public async findQuizByIdWithQuestions(quizId: string): Promise<QuizEntity> {
    const quiz = await this._libQuizRepo.findQuiz({
      condition: { ids: [quizId] },
      include: { shouldIncludeQuestions: true },
    });
    if (!quiz) {
      return null;
    }

    return this._quizMapper.toDomain(quiz);
  }

  public async findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]> {
    const rows = await this._libQuizRepo.findAllQuizzes({
      condition: {
        status: input.where.status,
        ids: input.where.ids,
        contentIds: input.where.contentIds,
        createdBy: input.where.createdBy,
      },
    });
    return rows.map((row) => this._quizMapper.toDomain(row));
  }

  public async getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>> {
    const { where, limit, before, after, order } = getPaginationQuizzesProps;
    const { rows, meta } = await this._libQuizRepo.getQuizzesPagination({
      condition: {
        status: where.status,
        createdBy: where.createdBy,
      },
      include: {
        shouldIncludeContent: {
          contentType: where.contentType,
        },
      },
      limit,
      before,
      after,
      order,
    });

    return {
      rows: rows.map((row) => this._quizMapper.toDomain(row)),
      meta,
    };
  }
  public async addQuestion(question: QuizQuestionEntity): Promise<void> {
    const createdAt = new Date();
    await this._libQuizRepo.bulkCreateQuizQuestions([
      {
        id: question.get('id'),
        quizId: question.get('quizId'),
        content: question.get('content'),
        answers: [],
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const answers = question.get('answers').map((answer, index) => {
      createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
      return {
        id: answer.id,
        questionId: question.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt,
        updatedAt: createdAt,
      };
    });
    await this._libQuizRepo.bulkCreateQuizAnswers(answers);
  }

  public async deleteQuestion(questionId: string): Promise<void> {
    await this._libQuizRepo.deleteQuizQuestion({ id: questionId });
  }

  public async updateQuestion(questionEntity: QuizQuestionEntity): Promise<void> {
    await this._libQuizRepo.updateQuizQuestion(questionEntity.get('id'), {
      content: questionEntity.get('content'),
    });
  }

  public async findQuestionById(questionId: string): Promise<QuizQuestionEntity> {
    const question = await this._libQuizRepo.findQuizQuestion({
      condition: { ids: [questionId] },
      include: { shouldIncludeAnswers: true },
    });

    return this._quizQuestionMapper.toDomain(question);
  }

  public async createAnswers(questionEntity: QuizQuestionEntity): Promise<void> {
    const answers = questionEntity.get('answers').map((answer, index) => {
      const createdAt = new Date();
      createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
      return {
        id: answer.id,
        questionId: questionEntity.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt,
        updatedAt: createdAt,
      };
    });
    await this._libQuizRepo.bulkCreateQuizAnswers(answers);
  }

  public async deleteAnswersByQuestionId(questionId: string): Promise<void> {
    await this._libQuizRepo.deleteQuizAnswer({ questionId });
  }
}
