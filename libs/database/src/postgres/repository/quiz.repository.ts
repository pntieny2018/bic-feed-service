import { CursorPaginationResult, CursorPaginator } from '@app/database/postgres/common';
import { PostModel } from '@app/database/postgres/model/post.model';
import { QuizAnswerModel } from '@app/database/postgres/model/quiz-answer.model';
import { QuizQuestionModel } from '@app/database/postgres/model/quiz-question.model';
import { QuizAttributes, QuizModel } from '@app/database/postgres/model/quiz.model';
import {
  FindAllQuizProps,
  FindOneQuizProps,
  GetPaginationQuizzesProps,
  ILibQuizRepository,
} from '@app/database/postgres/repository/interface';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';

export class LibQuizRepository implements ILibQuizRepository {
  private readonly QUERY_LIMIT_DEFAULT = 10;

  public constructor(
    @InjectModel(QuizModel)
    private readonly _quizModel: typeof QuizModel,

    @InjectModel(QuizQuestionModel)
    private readonly _quizQuestionModel: typeof QuizQuestionModel,

    @InjectModel(QuizAnswerModel)
    private readonly _quizAnswerModel: typeof QuizAnswerModel
  ) {}

  public async create(data: QuizAttributes): Promise<void> {
    await this._quizModel.create(data);
  }

  public async update(quizId: string, data: Partial<QuizAttributes>): Promise<void> {
    await this._quizModel.update(data, { where: { id: quizId } });

    if (data?.questions) {
      await this._quizQuestionModel.destroy({ where: { quizId: quizId } });
      await this._quizQuestionModel.bulkCreate(
        data.questions.map((question) => ({
          id: question.id,
          quizId: quizId,
          content: question.content,
        }))
      );
      await this._quizAnswerModel.bulkCreate(
        data.questions.flatMap((question) =>
          question.answers.map((answer) => ({
            id: answer.id,
            quizId: quizId,
            questionId: question.id,
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

  public async findOne(input: FindOneQuizProps): Promise<QuizModel> {
    const findOptions: FindOptions<QuizAttributes> = this._buildFindOptions(input);
    return this._quizModel.findOne(findOptions);
  }

  private _buildFindOptions(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): FindOptions<QuizAttributes> {
    const findOption: FindOptions<QuizAttributes> = {};
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
      findOption.attributes = options.attributes as (keyof QuizAttributes)[];
    }
    return findOption;
  }

  private _getCondition(
    options: Partial<FindAllQuizProps & FindOneQuizProps>
  ): WhereOptions<QuizAttributes> {
    const { createdBy, status, id, ids, contentId, contentIds } = options.where;
    const where: WhereOptions<QuizAttributes> = {};

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

  public async findAll(input: FindAllQuizProps): Promise<QuizModel[]> {
    const findOptions: FindOptions<QuizAttributes> = this._buildFindOptions(input);
    return this._quizModel.findAll(findOptions);
  }

  public async getPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizModel>> {
    const findOption: FindOptions<QuizAttributes> = {};
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
      findOption.attributes = attributes as (keyof QuizAttributes)[];
    }

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
}
