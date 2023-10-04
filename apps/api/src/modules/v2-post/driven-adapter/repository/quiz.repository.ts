import { CursorPaginationResult } from '../../../../common/types';
import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';
import {
  FindAllQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizQuestionMapper } from '../mapper/quiz-question.mapper';
import { QuizMapper } from '../mapper/quiz.mapper';
import {
  LibQuizAnswerRepository,
  LibQuizQuestionRepository,
  LibQuizRepository,
} from '@libs/database/postgres/repository';
import { WhereOptions } from 'sequelize';
import { QuizAttributes } from '@libs/database/postgres/model/quiz.model';
import { PostModel } from '@libs/database/postgres/model/post.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizRepository implements IQuizRepository {
  public constructor(
    private readonly _libQuizRepo: LibQuizRepository,
    private readonly _libQuizQuestionRepo: LibQuizQuestionRepository,
    private readonly _libQuizAnswerRepo: LibQuizAnswerRepository,
    private readonly _quizQuestionMapper: QuizQuestionMapper,
    private readonly _quizMapper: QuizMapper
  ) {}

  public async createQuiz(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.create(model);
  }

  public async updateQuiz(quizEntity: QuizEntity): Promise<void> {
    const quiz = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.update(quiz, {
      where: { id: quizEntity.get('id') },
    });

    if (quiz.questions !== undefined) {
      await this._libQuizQuestionRepo.delete({ where: { quizId: quizEntity.get('id') } });

      const questions = quiz.questions.map((question, index) => {
        const createdAt = new Date();
        createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
        return {
          id: question.id,
          quizId: question.quizId,
          content: question.content,
          createdAt: createdAt,
          updatedAt: createdAt,
        };
      });

      const answers = quiz.questions.flatMap((question) =>
        question.answers.map((answer, index) => {
          const createdAt = new Date();
          createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
          return {
            id: answer.id,
            questionId: question.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: createdAt,
            updatedAt: createdAt,
          };
        })
      );

      await this._libQuizQuestionRepo.bulkCreate(questions);
      await this._libQuizAnswerRepo.bulkCreate(answers);
    }
  }

  public async deleteQuiz(id: string): Promise<void> {
    await this._libQuizRepo.delete({
      where: { id },
    });
  }

  public async findQuizById(quizId: string): Promise<QuizEntity> {
    const model = await this._libQuizRepo.first({
      where: { id: quizId },
    });
    return this._quizMapper.toDomain(model);
  }

  public async findQuizByIdWithQuestions(quizId: string): Promise<QuizEntity> {
    const quiz = await this._libQuizRepo.first({
      where: { id: quizId },
      include: [
        {
          model: this._libQuizQuestionRepo.getModel(),
          as: 'questions',
          required: false,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: this._libQuizAnswerRepo.getModel(),
              as: 'answers',
              required: false,
              order: [['createdAt', 'ASC']],
            },
          ],
        },
      ],
    });
    if (!quiz) {
      return null;
    }

    return this._quizMapper.toDomain(quiz);
  }

  public async findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]> {
    const rows = await this._libQuizRepo.findMany({
      where: {
        status: input.where.status,
        id: input.where.ids,
        postId: input.where.contentId,
        createdBy: input.where.createdBy,
      },
    });
    return rows.map((row) => this._quizMapper.toDomain(row));
  }

  public async getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>> {
    const { where, limit, before, after, order } = getPaginationQuizzesProps;

    const whereOptions: WhereOptions<QuizAttributes> = {};
    if (where.status) {
      whereOptions.status = where.status;
    }

    if (where.createdBy) {
      whereOptions.createdBy = where.createdBy;
    }

    const { rows, meta } = await this._libQuizRepo.cursorPaginate(
      {
        where: {
          status: where.status,
          createdBy: where.createdBy,
        },
        include: [
          {
            model: PostModel,
            as: 'post',
            required: true,
            where: {
              isHidden: false,
              type: where.contentType,
            },
          },
        ],
      },
      {
        limit,
        before,
        after,
        order,
        column: 'createdAt',
      }
    );

    return {
      rows: rows.map((row) => this._quizMapper.toDomain(row)),
      meta,
    };
  }

  public async createQuestion(questionEntity: QuizQuestionEntity): Promise<void> {
    await this._libQuizQuestionRepo.bulkCreate([
      this._quizQuestionMapper.toPersistence(questionEntity),
    ]);
  }

  public async deleteQuestion(questionId: string): Promise<void> {
    await this._libQuizQuestionRepo.delete({ where: { id: questionId } });
  }

  public async updateQuestion(questionEntity: QuizQuestionEntity): Promise<void> {
    await this._libQuizQuestionRepo.update(
      {
        content: questionEntity.get('content'),
      },
      {
        where: { id: questionEntity.get('id') },
      }
    );
  }

  public async findQuestionById(questionId: string): Promise<QuizQuestionEntity> {
    const question = await this._libQuizQuestionRepo.first({
      where: { id: questionId },
      include: [
        {
          model: this._libQuizAnswerRepo.getModel(),
          as: 'answers',
          required: false,
        },
      ],
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
    await this._libQuizAnswerRepo.bulkCreate(answers);
  }

  public async deleteAnswersByQuestionId(questionId: string): Promise<void> {
    await this._libQuizAnswerRepo.delete({ where: { questionId } });
  }
}
