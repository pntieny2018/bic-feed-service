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
import { QuizQuestionModel } from '../../../../database/models/quiz-question.model';
import { QuizAnswerModel } from '../../../../database/models/quiz-answer.model';
import { QuizQuestionEntity } from '../../domain/model/quiz/quiz-question.entity';
import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';

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

    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService
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
        quizEntity.get('questions').map((quizEntity) => ({
          id: quizEntity.get('id'),
          quizId: quizEntity.get('quizId'),
          content: quizEntity.get('content'),
        }))
      );
      await this._quizAnswerModel.bulkCreate(
        quizEntity.get('questions').flatMap((question) =>
          question.get('answers').map((answer) => ({
            id: answer.id,
            questionId: question.get('id'),
            content: answer.content,
            isCorrect: answer.isCorrect,
          }))
        )
      );
    }
  }

  public async delete(id: string): Promise<void> {
    await this._quizModel.destroy({ where: { id: id } });
  }

  public async findOne(id: string): Promise<QuizEntity> {
    const entity = await this._quizModel.findByPk(id, {
      include: [
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
      ],
    });
    return this._modelToEntity(entity);
  }

  public async findQuizWithQuestions(id: string): Promise<QuizEntity> {
    const entity = await this._quizModel.findByPk(id, {
      include: [
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
      ],
    });
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
      questions: quiz.questions
        ? quiz.questions.map(
            (question) =>
              new QuizQuestionEntity({
                id: question.id,
                quizId: question.quizId,
                content: question.content,
                answers: question.answers.map((answer) => ({
                  id: answer.id,
                  content: answer.content,
                  isCorrect: answer.isCorrect,
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
    if (!question) return null;
    return new QuizQuestionEntity({
      id: question.id,
      content: question.content,
      quizId: question.quizId,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        content: answer.content,
        isCorrect: answer.isCorrect,
      })),
    });
  }
  public async addQuestion(question: QuizQuestionEntity): Promise<void> {
    await this._quizQuestionModel.create({
      id: question.get('id'),
      quizId: question.get('quizId'),
      content: question.get('content'),
    });
    await this._quizAnswerModel.bulkCreate(
      question.get('answers').map((answer) => ({
        id: answer.id,
        questionId: question.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
      }))
    );
  }

  public async deleteQuestion(questionId: string): Promise<void> {
    await this._quizQuestionModel.destroy({ where: { id: questionId } });
  }

  public async updateQuestion(question: QuizQuestionEntity): Promise<void> {
    await this._quizQuestionModel.update(
      {
        content: question.get('content'),
      },
      { where: { id: question.get('id') } }
    );
    await this._quizAnswerModel.destroy({ where: { questionId: question.get('id') } });
    await this._quizAnswerModel.bulkCreate(
      question.get('answers').map((answer) => ({
        id: answer.id,
        questionId: question.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
      }))
    );
  }
}
