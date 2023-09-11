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
import { QuizMapper } from '../mapper/quiz.mapper';

export class QuizRepository implements IQuizRepository {
  public constructor(
    @Inject(LIB_QUIZ_REPOSITORY_TOKEN)
    private readonly _libQuizRepo: ILibQuizRepository,

    private readonly _quizMapper: QuizMapper,

    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,
    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel
  ) {}

  public async create(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.createQuiz(model);
  }

  public async update(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);

    await this._libQuizRepo.updateQuiz(quizEntity.get('id'), model);
  }

  public async delete(id: string): Promise<void> {
    await this._libQuizRepo.deleteQuiz({
      id,
    });
  }

  public async findOne(id: string): Promise<QuizEntity> {
    const model = await this._libQuizRepo.findQuiz({
      condition: { ids: [id] },
    });
    return this._quizMapper.toDomain(model);
  }

  public async findQuizWithQuestions(id: string): Promise<QuizEntity> {
    const quiz = await this._libQuizRepo.findQuiz({
      condition: { ids: [id] },
      include: { shouldIncludeQuestions: true },
    });
    if (!quiz) {
      return null;
    }

    return this._quizMapper.toDomain(quiz);
  }

  public async findAll(input: FindAllQuizProps): Promise<QuizEntity[]> {
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

  public async genQuestions(quizEntity: QuizEntity, rawContent: string): Promise<void> {
    const { questions, usage, model, maxTokens, completion } =
      await this._openaiService.generateQuestion({
        content: rawContent,
        numberOfQuestions: quizEntity.get('numberOfQuestions'),
        numberOfAnswers: quizEntity.get('numberOfAnswers'),
      });
    quizEntity.updateAttribute({
      meta: {
        usage,
        model,
        maxTokens,
        completion,
      },
      questions: questions.map(
        (question) =>
          new QuizQuestionEntity({
            ...question,
            quizId: quizEntity.get('id'),
          })
      ),
    });
  }

  public async findQuizQuestion(id: string): Promise<QuizQuestionEntity> {
    const question = await this._quizQuestionModel.findByPk(id, {
      include: [
        {
          model: QuizAnswerModel,
          as: 'answers',
          required: false,
        },
      ],
    });
    if (!question) {
      return null;
    }
    return new QuizQuestionEntity({
      id: question.id,
      content: question.content,
      quizId: question.quizId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      })),
    });
  }

  public async addQuestion(question: QuizQuestionEntity): Promise<void> {
    await this._libQuizRepo.bulkCreateQuizQuestions([
      {
        id: question.get('id'),
        quizId: question.get('quizId'),
        content: question.get('content'),
        answers: [],
      },
    ]);

    const createdAt = new Date();

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

  public async updateQuestion(question: QuizQuestionEntity): Promise<void> {
    await this._quizQuestionModel.update(
      {
        content: question.get('content'),
      },
      { where: { id: question.get('id') } }
    );
    await this._quizAnswerModel.destroy({ where: { questionId: question.get('id') } });

    const answers = question.get('answers').map((answer, index) => {
      const createdAt = new Date();
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
    await this._quizAnswerModel.bulkCreate(answers);
  }
}
