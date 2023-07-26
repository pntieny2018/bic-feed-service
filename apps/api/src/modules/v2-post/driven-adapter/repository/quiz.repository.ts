import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import {
  FindAllQuizProps,
  FindOneQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizEntity } from '../../domain/model/quiz';
import { IQuiz, QuizModel } from '../../../../database/models/quiz.model';
import { PostModel } from '../../../../database/models/post.model';
import {
  IQuizFactory,
  QUIZ_FACTORY_TOKEN,
} from '../../domain/factory/interface/quiz.factory.interface';
import { CursorPaginator } from '../../../../common/dto';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { UserTakeQuizDetailModel } from '../../../../database/models/user_take_quiz_detail.model';
import { QuizQuestionModel } from '../../../../database/models/quiz-question.model';
import { QuizAnswerModel } from '../../../../database/models/quiz-answer.model';
import { UserTakeQuizModel } from '../../../../database/models/user_take_quiz.model';
import { TakeQuizEntity } from '../../domain/model/user-taking-quiz';

export class QuizRepository implements IQuizRepository {
  private readonly QUERY_LIMIT_DEFAULT = 10;

  public constructor(
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _factory: IQuizFactory,
    @InjectModel(QuizModel)
    private readonly _quizModel: typeof QuizModel,

    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,

    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel,

    @InjectModel(UserTakeQuizDetailModel)
    private readonly _userTakeQuizDetailModel: typeof UserTakeQuizDetailModel,

    @InjectModel(UserTakeQuizModel)
    private readonly _userTakeQuizModel: typeof UserTakeQuizModel
  ) {}

  public async create(quizEntity: QuizEntity): Promise<void> {
    await this._quizModel.create({
      id: quizEntity.get('id'),
      title: quizEntity.get('title'),
      postId: quizEntity.get('contentId'),
      description: quizEntity.get('description'),
      numberOfQuestions: quizEntity.get('numberOfQuestions'),
      numberOfAnswers: quizEntity.get('numberOfAnswers'),
      numberOfQuestionsDisplay: quizEntity.get('numberOfQuestionsDisplay'),
      numberOfAnswersDisplay: quizEntity.get('numberOfAnswersDisplay'),
      status: quizEntity.get('status'),
      genStatus: quizEntity.get('genStatus'),
      error: quizEntity.get('error'),
      isRandom: quizEntity.get('isRandom'),
      createdBy: quizEntity.get('createdBy'),
      updatedBy: quizEntity.get('updatedBy'),
      createdAt: quizEntity.get('createdAt'),
      updatedAt: quizEntity.get('updatedAt'),
      meta: quizEntity.get('meta'),
    });
  }

  public async update(quizEntity: QuizEntity): Promise<void> {
    await this._quizModel.update(
      {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        numberOfQuestions: quizEntity.get('numberOfQuestions'),
        numberOfAnswers: quizEntity.get('numberOfAnswers'),
        numberOfQuestionsDisplay: quizEntity.get('numberOfQuestionsDisplay'),
        numberOfAnswersDisplay: quizEntity.get('numberOfAnswersDisplay'),
        status: quizEntity.get('status'),
        error: quizEntity.get('error'),
        timeLimit: quizEntity.get('timeLimit'),
        genStatus: quizEntity.get('genStatus'),
        isRandom: quizEntity.get('isRandom'),
        updatedBy: quizEntity.get('updatedBy'),
        updatedAt: quizEntity.get('updatedAt'),
        meta: quizEntity.get('meta'),
      },
      { where: { id: quizEntity.get('id') } }
    );
    if (quizEntity.get('questions') !== undefined) {
      await this._quizQuestionModel.destroy({ where: { quizId: quizEntity.get('id') } });
      await this._quizQuestionModel.bulkCreate(
        quizEntity.get('questions').map((question) => ({
          id: question.id,
          quizId: quizEntity.get('id'),
          content: question.question,
        }))
      );
      await this._quizAnswerModel.bulkCreate(
        quizEntity.get('questions').flatMap((question) =>
          question.answers.map((answer) => ({
            id: answer.id,
            quizId: quizEntity.get('id'),
            questionId: question.id,
            content: answer.answer,
            isCorrect: answer.isCorrect,
          }))
        )
      );
    }
  }

  public async delete(id: string): Promise<void> {
    await this._quizModel.destroy({ where: { id: id } });
  }

  public async createTakeQuiz(takeQuizEntity: TakeQuizEntity): Promise<void> {
    await this._userTakeQuizModel.create({
      id: takeQuizEntity.get('id'),
      quizId: takeQuizEntity.get('quizId'),
      postId: takeQuizEntity.get('contentId'),
      quizSnapshot: {
        title: takeQuizEntity.get('quizSnapshot').title,
        description: takeQuizEntity.get('quizSnapshot').description,
        questions: takeQuizEntity.get('quizSnapshot').questions.map((question) => ({
          id: question.id,
          content: question.question,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.answer,
            isCorrect: answer.isCorrect,
          })),
        })),
      },
      score: takeQuizEntity.get('score'),
      timeLimit: takeQuizEntity.get('timeLimit'),
      totalQuestionsCompleted: takeQuizEntity.get('totalQuestionsCompleted'),
      startedAt: takeQuizEntity.get('startedAt'),
      finishedAt: takeQuizEntity.get('finishedAt'),
      createdBy: takeQuizEntity.get('createdBy'),
      updatedBy: takeQuizEntity.get('updatedBy'),
      createdAt: takeQuizEntity.get('createdAt'),
      updatedAt: takeQuizEntity.get('updatedAt'),
    });
  }

  public async getTakeQuiz(takeId: string): Promise<TakeQuizEntity> {
    const takeQuizModel = await this._userTakeQuizModel.findByPk(takeId);
    const details = await this._userTakeQuizDetailModel.findAll({
      where: {
        userTakeQuizId: takeId,
      },
    });
    return new TakeQuizEntity({
      id: takeQuizModel.id,
      contentId: takeQuizModel.postId,
      quizId: takeQuizModel.quizId,
      quizSnapshot: takeQuizModel.quizSnapshot,
      score: takeQuizModel.score,
      timeLimit: takeQuizModel.timeLimit,
      totalQuestionsCompleted: takeQuizModel.totalQuestionsCompleted,
      startedAt: takeQuizModel.startedAt,
      finishedAt: takeQuizModel.finishedAt,
      createdBy: takeQuizModel.createdBy,
      updatedBy: takeQuizModel.updatedBy,
      createdAt: takeQuizModel.createdAt,
      updatedAt: takeQuizModel.updatedAt,
      details: details.map((detail) => ({
        id: detail.id,
        questionId: detail.questionId,
        answerId: detail.answerId,
        isCorrect: detail.isCorrect,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
      })),
    });
  }

  public async findOne(input: FindOneQuizProps): Promise<QuizEntity> {
    const findOptions: FindOptions<IQuiz> = this._buildFindOptions(input);
    const entity = await this._quizModel.findOne(findOptions);
    if (input.attributes) findOptions.attributes = input.attributes as (keyof IQuiz)[];
    return this._modelToEntity(entity);
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
    if (options.attributes) findOption.attributes = options.attributes as (keyof IQuiz)[];
    return findOption;
  }

  private _getCondition(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): WhereOptions<IQuiz> {
    const { createdBy, status, id, ids, contentId, contentIds } = options.where;
    const where: WhereOptions<IQuiz> = {};

    if (createdBy) where['createdBy'] = createdBy;

    if (id) where['id'] = id;

    if (ids) where['id'] = ids;

    if (contentId) where['postId'] = contentId;

    if (contentIds) where['postId'] = contentIds;

    if (status) where['status'] = status;

    return where;
  }

  public async findAll(input: FindAllQuizProps): Promise<QuizEntity[]> {
    const findOptions: FindOptions<IQuiz> = this._buildFindOptions(input);
    const rows = await this._quizModel.findAll(findOptions);
    return rows.map((row) => this._modelToEntity(row));
  }

  private _modelToEntity(quiz: QuizModel): QuizEntity {
    if (quiz === null) return null;
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
      numberOfAnswersDisplay: quiz.numberOfAnswersDisplay,
      timeLimit: quiz.timeLimit,
      isRandom: quiz.isRandom,
      questions: (quiz.questions || []).map((question) => ({
        id: question.id,
        question: question.content,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          answer: answer.content,
          isCorrect: answer.isCorrect,
        })),
      })),
      meta: quiz.meta,
      createdBy: quiz.createdBy,
      updatedBy: quiz.updatedBy,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    });
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

    if (attributes) findOption.attributes = attributes as (keyof IQuiz)[];

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
}
