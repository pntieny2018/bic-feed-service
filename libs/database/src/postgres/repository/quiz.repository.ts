import { ORDER } from '@beincom/constants';
import { InjectModel } from '@nestjs/sequelize';
import {
  Op,
  FindOptions,
  WhereOptions,
  Includeable,
  FindAttributeOptions,
  Order,
  GroupOption,
} from 'sequelize';

import { CursorPaginationResult, CursorPaginator, PAGING_DEFAULT_LIMIT } from '../common';
import { PostModel } from '../model/post.model';
import { QuizAnswerAttributes, QuizAnswerModel } from '../model/quiz-answer.model';
import { QuizQuestionAttributes, QuizQuestionModel } from '../model/quiz-question.model';
import { QuizAttributes, QuizModel } from '../model/quiz.model';
import {
  FindQuizProps,
  GetPaginationQuizzesProps,
  ILibQuizRepository,
  FindQuizConditionOptions,
  FindQuizIncludeOptions,
  FindQuizAttributeOptions,
  FindQuizOrderOptions,
  FindQuizQuestionProps,
  FindQuizQuestionConditionOptions,
  FindQuizQuestionIncludeOptions,
} from '../repository/interface';

export class LibQuizRepository implements ILibQuizRepository {
  public constructor(
    @InjectModel(QuizModel)
    private readonly _quizModel: typeof QuizModel,
    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,
    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel,
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel
  ) {}

  public async createQuiz(quiz: QuizAttributes): Promise<void> {
    await this._quizModel.create(quiz);
  }

  public async updateQuiz(quizId: string, quiz: Partial<QuizAttributes>): Promise<void> {
    await this._quizModel.update(quiz, { where: { id: quizId } });

    if (quiz.questions !== undefined) {
      await this._quizQuestionModel.destroy({ where: { quizId } });
      const questions = quiz.questions.map((question, index) => {
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

      const answers = quiz.questions.flatMap((question) =>
        question.answers.map((answer, index) => {
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

  public async deleteQuiz(conditions: WhereOptions<QuizAttributes>): Promise<void> {
    await this._quizModel.destroy({ where: conditions });
  }

  public async findQuiz(findOptions: FindQuizProps): Promise<QuizModel> {
    const options = this._buildFindOptions(findOptions);
    return this._quizModel.findOne(options);
  }

  public async findAllQuizzes(findOptions: FindQuizProps): Promise<QuizModel[]> {
    const options = this._buildFindOptions(findOptions);
    return this._quizModel.findAll(options);
  }

  public async getQuizzesPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizModel>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order } = getPaginationQuizzesProps;

    const findOption = this._buildFindOptions(getPaginationQuizzesProps);

    const paginator = new CursorPaginator(
      this._quizModel,
      ['createdAt'],
      { before, after, limit },
      order
    );
    const { rows, meta } = await paginator.paginate(findOption);

    return {
      rows,
      meta,
    };
  }

  private _buildFindOptions(options: FindQuizProps): FindOptions<QuizAttributes> {
    const findOption: FindOptions<QuizAttributes> = {};

    findOption.where = this._buildWhereOptions(options.condition);
    findOption.include = this._buildRelationOptions(options.include);
    findOption.attributes = this._buildAttributesOptions(options.attributes);
    findOption.order = this._buildOrderOptions(options.orderOptions);
    findOption.group = this._buildGroupOptions(options.group);

    return findOption;
  }

  private _buildWhereOptions(options: FindQuizConditionOptions): WhereOptions<QuizAttributes> {
    const whereOptions: WhereOptions<QuizAttributes> = {};

    const conditions = [];

    if (options.ids) {
      conditions.push({ id: options.ids });
    }

    if (options.contentIds) {
      conditions.push({ postId: options.contentIds });
    }

    if (options.status) {
      conditions.push({ status: options.status });
    }

    if (options.createdBy) {
      conditions.push({ createdBy: options.createdBy });
    }

    if (conditions.length > 0) {
      whereOptions[Op.and] = conditions;
    }

    return whereOptions;
  }

  private _buildRelationOptions(options: FindQuizIncludeOptions = {}): Includeable[] {
    const relationOptions: Includeable[] = [];

    if (options.shouldIncludeQuestions) {
      relationOptions.push({
        model: this._quizQuestionModel,
        as: 'questions',
        required: false,
        order: [['createdAt', 'ASC']],
        include: [
          {
            model: this._quizAnswerModel,
            as: 'answers',
            required: false,
            order: [['createdAt', 'ASC']],
          },
        ],
      });
    }

    if (options.shouldIncludeContent) {
      relationOptions.push({
        model: this._postModel,
        as: 'post',
        required: true,
        where: {
          isHidden: false,
          type: options.shouldIncludeContent.contentType,
        },
      });
    }

    return relationOptions;
  }

  private _buildAttributesOptions(options: FindQuizAttributeOptions = {}): FindAttributeOptions {
    let attributesOptions: FindAttributeOptions;

    if (options.exclude?.length > 0) {
      attributesOptions['exclude'] = options.exclude;
    }

    if (options.include) {
      attributesOptions['include'] = options.include;
    }

    return attributesOptions;
  }

  private _buildOrderOptions(options: FindQuizOrderOptions = {}): Order {
    const orderOptions = [];

    if (options.sortColumn) {
      orderOptions.push([options.sortColumn, options.sortBy || ORDER.DESC]);
    }

    return orderOptions;
  }

  private _buildGroupOptions(options: string[] = []): GroupOption {
    return options;
  }

  public async bulkCreateQuizQuestions(questions: QuizQuestionAttributes[]): Promise<void> {
    await this._quizQuestionModel.bulkCreate(questions);
  }

  public async deleteQuizQuestion(conditions: WhereOptions<QuizQuestionAttributes>): Promise<void> {
    await this._quizQuestionModel.destroy({ where: conditions });
  }

  public async findQuizQuestion(findOptions: FindQuizQuestionProps): Promise<QuizQuestionModel> {
    const options = this._buildFindQuizQuestionOptions(findOptions);
    return this._quizQuestionModel.findOne(options);
  }

  private _buildFindQuizQuestionOptions(
    options: FindQuizQuestionProps
  ): FindOptions<QuizQuestionAttributes> {
    const findOption: FindOptions<QuizQuestionAttributes> = {};

    findOption.where = this._buildWhereOptionsForQuizQuestion(options.condition);
    findOption.include = this._buildRelationOptionsForQuizQuestion(options.include);

    return findOption;
  }

  private _buildWhereOptionsForQuizQuestion(
    options: FindQuizQuestionConditionOptions
  ): WhereOptions<QuizQuestionAttributes> {
    const whereOptions: WhereOptions<QuizQuestionAttributes> = {};

    const conditions = [];

    if (options.ids) {
      conditions.push({ id: options.ids });
    }

    if (options.quizId) {
      conditions.push({ quizId: options.quizId });
    }

    if (conditions.length > 0) {
      whereOptions[Op.and] = conditions;
    }

    return whereOptions;
  }

  private _buildRelationOptionsForQuizQuestion(
    options: FindQuizQuestionIncludeOptions = {}
  ): Includeable[] {
    const relationOptions: Includeable[] = [];

    if (options.shouldIncludeAnswers) {
      relationOptions.push({
        model: this._quizAnswerModel,
        as: 'answers',
        required: false,
      });
    }

    return relationOptions;
  }

  public async bulkCreateQuizAnswers(answers: QuizAnswerAttributes[]): Promise<void> {
    await this._quizAnswerModel.bulkCreate(answers);
  }
}
