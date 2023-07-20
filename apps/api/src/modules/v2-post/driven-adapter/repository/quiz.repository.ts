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
import { CursorPaginator } from '../../../../common/dto/cusor-pagination';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export class QuizRepository implements IQuizRepository {
  public constructor(
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _factory: IQuizFactory,
    @InjectModel(QuizModel)
    private readonly _quizModel: typeof QuizModel
  ) {}

  public async create(data: QuizEntity): Promise<void> {
    await this._quizModel.create({
      id: data.get('id'),
      title: data.get('title'),
      contentId: data.get('contentId'),
      description: data.get('description'),
      numberOfQuestions: data.get('numberOfQuestions'),
      numberOfAnswers: data.get('numberOfAnswers'),
      numberOfQuestionsDisplay: data.get('numberOfQuestionsDisplay'),
      numberOfAnswersDisplay: data.get('numberOfAnswersDisplay'),
      status: data.get('status'),
      genStatus: data.get('genStatus'),
      error: data.get('error'),
      isRandom: data.get('isRandom'),
      questions: data.get('questions'),
      createdBy: data.get('createdBy'),
      updatedBy: data.get('updatedBy'),
      createdAt: data.get('createdAt'),
      updatedAt: data.get('updatedAt'),
      meta: data.get('meta'),
    });
  }

  public async update(data: QuizEntity): Promise<void> {
    await this._quizModel.update(
      {
        title: data.get('title'),
        description: data.get('description'),
        numberOfQuestions: data.get('numberOfQuestions'),
        numberOfAnswers: data.get('numberOfAnswers'),
        numberOfQuestionsDisplay: data.get('numberOfQuestionsDisplay'),
        numberOfAnswersDisplay: data.get('numberOfAnswersDisplay'),
        status: data.get('status'),
        error: data.get('error'),
        genStatus: data.get('genStatus'),
        isRandom: data.get('isRandom'),
        questions: data.get('questions'),
        updatedBy: data.get('updatedBy'),
        updatedAt: data.get('updatedAt'),
        meta: data.get('meta'),
      },
      { where: { id: data.get('id') } }
    );
  }

  public async delete(id: string): Promise<void> {
    await this._quizModel.destroy({ where: { id: id } });
  }

  public async findOne(input: FindOneQuizProps): Promise<QuizEntity> {
    const findOptions: FindOptions<IQuiz> = this._buildFindOptions(input);
    const entity = await this._quizModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  private _buildFindOptions(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): FindOptions<IQuiz> {
    const findOption: FindOptions<IQuiz> = {};
    findOption.where = this._getCondition(options);
    const includeAttr = [];
    if (options.include) {
      const { includeContent } = options.include;
      if (includeContent) {
        includeAttr.push({
          model: PostModel,
          attributes: {
            exclude: ['content'],
          },
          as: 'post',
          required: true,
          where: {
            isHidden: includeContent.isHidden,
            status: includeContent.status,
            ...(includeContent.type && {
              type: includeContent.type,
            }),
          },
        });
      }
    }

    if (options.attributes) findOption.attributes = options.attributes as (keyof IQuiz)[];

    if (includeAttr.length) findOption.include = includeAttr;

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

    if (contentId) where['contentId'] = contentId;

    if (contentIds) where['contentId'] = contentIds;

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
      contentId: quiz.contentId,
      status: quiz.status,
      genStatus: quiz.genStatus,
      description: quiz.description,
      numberOfQuestions: quiz.numberOfQuestions,
      numberOfAnswers: quiz.numberOfAnswers,
      numberOfQuestionsDisplay: quiz.numberOfQuestionsDisplay,
      numberOfAnswersDisplay: quiz.numberOfAnswersDisplay,
      isRandom: quiz.isRandom,
      questions: quiz.questions,
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
    const { after, before, limit, order } = getPaginationQuizzesProps;
    const findOption = this._buildFindOptions(getPaginationQuizzesProps);
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
