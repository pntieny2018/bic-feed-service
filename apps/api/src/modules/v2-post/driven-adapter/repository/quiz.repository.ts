import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { ILibQuizRepository, LIB_QUIZ_REPOSITORY_TOKEN } from '@libs/database/postgres';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';

import { CursorPaginator } from '../../../../common/dto';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostModel } from '../../../../database/models/post.model';
import { QuizAnswerModel } from '../../../../database/models/quiz-answer.model';
import { QuizQuestionModel } from '../../../../database/models/quiz-question.model';
import { IQuiz, QuizModel } from '../../../../database/models/quiz.model';
import { QuizGenStatus, QuizStatus } from '../../data-type';
import {
  IQuizFactory,
  QUIZ_FACTORY_TOKEN,
} from '../../domain/factory/interface/quiz.factory.interface';
import { QuizEntity } from '../../domain/model/quiz';
import { QuizQuestionEntity } from '../../domain/model/quiz/quiz-question.entity';
import {
  FindAllQuizProps,
  FindOneQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizQuestionMapper } from '../mapper/quiz-question.mapper';
import { QuizMapper } from '../mapper/quiz.mapper';

export class QuizRepository implements IQuizRepository {
  private readonly QUERY_LIMIT_DEFAULT = 10;

  public constructor(
    @Inject(LIB_QUIZ_REPOSITORY_TOKEN)
    private readonly _libQuizRepo: ILibQuizRepository,

    private readonly _quizQuestionMapper: QuizQuestionMapper,
    private readonly _quizMapper: QuizMapper,

    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _factory: IQuizFactory,
    @InjectModel(QuizModel)
    private readonly _quizModel: typeof QuizModel,
    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,
    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel,
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService
  ) {}

  public async createQuiz(quizEntity: QuizEntity): Promise<void> {
    await this._quizModel.create({
      id: quizEntity.get('id'),
      title: quizEntity.get('title'),
      postId: quizEntity.get('contentId'),
      description: quizEntity.get('description'),
      numberOfQuestions: quizEntity.get('numberOfQuestions'),
      numberOfAnswers: quizEntity.get('numberOfAnswers'),
      numberOfQuestionsDisplay: quizEntity.get('numberOfQuestionsDisplay'),
      timeLimit: quizEntity.get('timeLimit'),
      status: quizEntity.get('status') as QuizStatus,
      genStatus: quizEntity.get('genStatus') as QuizGenStatus,
      error: quizEntity.get('error'),
      isRandom: quizEntity.get('isRandom'),
      createdBy: quizEntity.get('createdBy'),
      updatedBy: quizEntity.get('updatedBy'),
      createdAt: quizEntity.get('createdAt'),
      updatedAt: quizEntity.get('updatedAt'),
      meta: quizEntity.get('meta'),
    });
  }

  public async updateQuiz(quizEntity: QuizEntity): Promise<void> {
    await this._libQuizRepo.updateQuiz(quizEntity.get('id'), {
      title: quizEntity.get('title'),
      description: quizEntity.get('description'),
      timeLimit: quizEntity.get('timeLimit'),
      numberOfQuestions: quizEntity.get('numberOfQuestions'),
      numberOfAnswers: quizEntity.get('numberOfAnswers'),
      numberOfQuestionsDisplay: quizEntity.get('numberOfQuestionsDisplay'),
      isRandom: quizEntity.get('isRandom'),
      meta: quizEntity.get('meta'),
      status: quizEntity.get('status') as QUIZ_STATUS,
      genStatus: quizEntity.get('genStatus') as QUIZ_PROCESS_STATUS,
      error: quizEntity.get('error'),
      updatedBy: quizEntity.get('updatedBy'),
      updatedAt: quizEntity.get('updatedAt'),
    });
  }

  // TODO: Remove this function
  public async updateQuizWithUpdateQuestions(quizEntity: QuizEntity): Promise<void> {
    await this._quizModel.update(
      {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        numberOfQuestions: quizEntity.get('numberOfQuestions'),
        numberOfAnswers: quizEntity.get('numberOfAnswers'),
        numberOfQuestionsDisplay: quizEntity.get('numberOfQuestionsDisplay'),
        status: quizEntity.get('status') as QuizStatus,
        error: quizEntity.get('error'),
        timeLimit: quizEntity.get('timeLimit'),
        genStatus: quizEntity.get('genStatus') as QuizGenStatus,
        isRandom: quizEntity.get('isRandom'),
        updatedBy: quizEntity.get('updatedBy'),
        updatedAt: quizEntity.get('updatedAt'),
        meta: quizEntity.get('meta'),
      },
      { where: { id: quizEntity.get('id') } }
    );
    if (quizEntity.get('questions') !== undefined) {
      await this._quizQuestionModel.destroy({ where: { quizId: quizEntity.get('id') } });
      const questions = quizEntity.get('questions').map((question, index) => {
        const createdAt = new Date();
        createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
        return {
          id: question.get('id'),
          quizId: question.get('quizId'),
          content: question.get('content'),
          createdAt: createdAt,
          updatedAt: createdAt,
        };
      });

      const answers = quizEntity.get('questions').flatMap((question) =>
        question.get('answers').map((answer, index) => {
          const createdAt = new Date();
          createdAt.setMilliseconds(createdAt.getMilliseconds() + index);
          return {
            id: answer.id,
            questionId: question.get('id'),
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: createdAt,
            updatedAt: createdAt,
          };
        })
      );

      await this._quizQuestionModel.bulkCreate(questions);
      await this._quizAnswerModel.bulkCreate(answers);
    }
  }

  public async deleteQuiz(quizId: string): Promise<void> {
    await this._quizModel.destroy({ where: { id: quizId } });
  }

  public async findQuizById(quizId: string): Promise<QuizEntity> {
    const entity = await this._quizModel.findByPk(quizId);
    return this._modelToEntity(entity);
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
    const findOptions: FindOptions<IQuiz> = this._buildFindOptions(input);
    const rows = await this._quizModel.findAll(findOptions);
    return rows.map((row) => this._modelToEntity(row));
  }

  public async getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizEntity>> {
    const findOption: FindOptions<IQuiz> = {};
    const {
      contentType,
      after,
      before,
      limit = this.QUERY_LIMIT_DEFAULT,
      order,
      attributes,
    } = getPaginationQuizzesProps;

    findOption.where = this._getCondition(getPaginationQuizzesProps);

    if (contentType) {
      findOption.include = [
        {
          model: PostModel,
          attributes: ['id'],
          as: 'post',
          required: true,
          where: {
            isHidden: false,
            type: contentType,
          },
        },
      ];
    }

    if (attributes) {
      findOption.attributes = attributes as (keyof IQuiz)[];
    }

    const paginator = new CursorPaginator(
      this._quizModel,
      ['createdAt'],
      { before, after, limit },
      order
    );
    const { rows, meta } = await paginator.paginate(findOption);

    return {
      rows: rows.map((row) => this._modelToEntity(row)),
      meta,
    };
  }

  private _buildFindOptions(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): FindOptions<IQuiz> {
    const findOption: FindOptions<IQuiz> = {};
    findOption.where = this._getCondition(options);
    findOption.include = [
      {
        model: QuizQuestionModel,
        as: 'questions',
        required: false,
        include: [
          {
            model: QuizAnswerModel,
            as: 'answers',
            required: false,
          },
        ],
      },
    ];
    if (options.attributes) {
      findOption.attributes = options.attributes as (keyof IQuiz)[];
    }
    return findOption;
  }

  private _getCondition(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): WhereOptions<IQuiz> {
    const { createdBy, status, id, ids, contentId, contentIds } = options.where;
    const where: WhereOptions<IQuiz> = {};

    if (createdBy) {
      where['createdBy'] = createdBy;
    }

    if (id) {
      where['id'] = id;
    }

    if (ids) {
      where['id'] = ids;
    }

    if (contentId) {
      where['postId'] = contentId;
    }

    if (contentIds) {
      where['postId'] = contentIds;
    }

    if (status) {
      where['status'] = status;
    }

    return where;
  }

  private _modelToEntity(quiz: QuizModel): QuizEntity {
    if (quiz === null) {
      return null;
    }
    return this._factory.reconstitute({
      id: quiz.id,
      title: quiz.title,
      contentId: quiz.postId,
      status: quiz.status,
      genStatus: quiz.genStatus,
      description: quiz.description,
      numberOfQuestions: quiz.numberOfQuestions,
      numberOfAnswers: quiz.numberOfAnswers,
      numberOfQuestionsDisplay: quiz.numberOfQuestionsDisplay,
      timeLimit: quiz.timeLimit,
      isRandom: quiz.isRandom,
      questions: quiz.questions
        ? quiz.questions.map(
            (question) =>
              new QuizQuestionEntity({
                id: question.id,
                quizId: question.quizId,
                content: question.content,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
                answers: question.answers.map((answer) => ({
                  id: answer.id,
                  content: answer.content,
                  isCorrect: answer.isCorrect,
                  createdAt: answer.createdAt,
                  updatedAt: answer.updatedAt,
                })),
              })
          )
        : undefined,
      meta: quiz.meta,
      createdBy: quiz.createdBy,
      updatedBy: quiz.updatedBy,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    });
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

  public async addQuestion(questionEntity: QuizQuestionEntity): Promise<void> {
    await this._quizQuestionModel.create({
      id: questionEntity.get('id'),
      quizId: questionEntity.get('quizId'),
      content: questionEntity.get('content'),
    });
    await this._quizAnswerModel.bulkCreate(
      questionEntity.get('answers').map((answer) => ({
        id: answer.id,
        questionId: questionEntity.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
      }))
    );
  }

  public async deleteQuestion(questionId: string): Promise<void> {
    await this._libQuizRepo.deleteQuizQuestion({ id: questionId });
  }

  public async updateQuestion(questionEntity: QuizQuestionEntity): Promise<void> {
    await this._quizQuestionModel.update(
      {
        content: questionEntity.get('content'),
      },
      { where: { id: questionEntity.get('id') } }
    );
    await this._quizAnswerModel.destroy({ where: { questionId: questionEntity.get('id') } });

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
    await this._quizAnswerModel.bulkCreate(answers);
  }

  public async findQuestionById(questionId: string): Promise<QuizQuestionEntity> {
    const question = await this._libQuizRepo.findQuizQuestion({
      condition: { ids: [questionId] },
      include: { shouldIncludeAnswers: true },
    });
    if (!question) {
      return null;
    }
    return this._quizQuestionMapper.toDomain(question);
  }
}
