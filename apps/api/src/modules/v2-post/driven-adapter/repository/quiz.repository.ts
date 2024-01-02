import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostModel, QuizAttributes } from '@libs/database/postgres/model';
import {
  LibQuizAnswerRepository,
  LibQuizQuestionRepository,
  LibQuizRepository,
} from '@libs/database/postgres/repository';
import { Inject, Injectable } from '@nestjs/common';
import { WhereOptions } from 'sequelize';

import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';
import {
  FindAllQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizQuestionMapper } from '../mapper/quiz-question.mapper';
import { QuizMapper } from '../mapper/quiz.mapper';

@Injectable()
export class QuizRepository implements IQuizRepository {
  public constructor(
    private readonly _libQuizRepo: LibQuizRepository,
    private readonly _libQuizQuestionRepo: LibQuizQuestionRepository,
    private readonly _libQuizAnswerRepo: LibQuizAnswerRepository,
    private readonly _quizQuestionMapper: QuizQuestionMapper,
    private readonly _quizMapper: QuizMapper,

    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepository: IContentCacheRepository
  ) {}

  public async createQuiz(quizEntity: QuizEntity): Promise<void> {
    const model = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.create(model);
    await this._contentCacheRepository.updateQuiz(quizEntity);
  }

  public async updateQuiz(quizEntity: QuizEntity): Promise<void> {
    const quiz = this._quizMapper.toPersistence(quizEntity);
    await this._libQuizRepo.update(quiz, {
      where: { id: quizEntity.get('id') },
    });

    await this._contentCacheRepository.updateQuiz(quizEntity);

    if (quiz.questions !== undefined && quiz.questions.length) {
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

  public async deleteQuiz(id: string, contentId: string): Promise<void> {
    await this._libQuizRepo.delete({
      where: { id },
    });
    await this._contentCacheRepository.deleteQuiz(contentId);
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
    return this._quizMapper.toDomain(quiz);
  }

  public async findAllQuizzes(input: FindAllQuizProps): Promise<QuizEntity[]> {
    const condition: WhereOptions<QuizAttributes> = {};
    if (input.where?.ids) {
      condition.id = input.where.ids;
    }
    if (input.where?.status) {
      condition.status = input.where.status;
    }
    if (input.where?.contentId) {
      condition.postId = input.where.contentId;
    }
    if (input.where?.contentIds) {
      condition.postId = input.where.contentIds;
    }
    if (input.where?.createdBy) {
      condition.createdBy = input.where.createdBy;
    }

    const rows = await this._libQuizRepo.findMany({
      where: condition,
    });
    return rows.map((row) => this._quizMapper.toDomain(row));
  }

  public async getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>> {
    const { where, limit, before, after, order } = getPaginationQuizzesProps;

    const condition: WhereOptions<QuizAttributes> = {};
    if (where.status) {
      condition.status = where.status;
    }
    if (where.createdBy) {
      condition.createdBy = where.createdBy;
    }

    const { rows, meta } = await this._libQuizRepo.cursorPaginate(
      {
        where: condition,
        include: [
          {
            model: PostModel,
            as: 'post',
            required: true,
            where: {
              isHidden: false,
              ...(where?.contentType && { type: where.contentType }),
            },
          },
        ],
      },
      {
        limit,
        before,
        after,
        order,
        sortColumns: ['createdAt'],
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
