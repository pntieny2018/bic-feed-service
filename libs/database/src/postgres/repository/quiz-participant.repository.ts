import { ORDER } from '@beincom/constants';
import { InjectModel } from '@nestjs/sequelize';
import {
  FindAttributeOptions,
  FindOptions,
  GroupOption,
  Includeable,
  Op,
  Order,
  WhereOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  QuizParticipantAnswerAttributes,
  QuizParticipantAnswerModel,
} from '../../postgres/model/quiz-participant-answers.model';
import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '../../postgres/model/quiz-participant.model';
import { CursorPaginationResult, CursorPaginator, PAGING_DEFAULT_LIMIT } from '../common';
import {
  FindQuizParticipantAttributeOptions,
  FindQuizParticipantConditionOptions,
  FindQuizParticipantIncludeOptions,
  FindQuizParticipantOrderOptions,
  FindQuizParticipantProps,
  GetPaginationQuizParticipantsProps,
  ILibQuizParticipantRepository,
} from '../repository/interface';

export class LibQuizParticipantRepository implements ILibQuizParticipantRepository {
  public constructor(
    @InjectModel(QuizParticipantAnswerModel)
    private readonly _quizParticipantAnswerModel: typeof QuizParticipantAnswerModel,

    @InjectModel(QuizParticipantModel)
    private readonly _quizParticipantModel: typeof QuizParticipantModel
  ) {}

  public async createQuizParticipant(quizParticipant: QuizParticipantAttributes): Promise<void> {
    await this._quizParticipantModel.create(quizParticipant);
  }

  public async updateQuizParticipant(
    quizParticipantId: string,
    quizParticipant: Partial<QuizParticipantAttributes>
  ): Promise<void> {
    await this._quizParticipantModel.update(quizParticipant, {
      where: {
        id: quizParticipantId,
      },
    });
  }

  public async findQuizParticipant(
    findOptions: FindQuizParticipantProps
  ): Promise<QuizParticipantModel> {
    const options = this._buildFindOptions(findOptions);
    return this._quizParticipantModel.findOne(options);
  }

  public async findAllQuizParticipants(
    findOptions: FindQuizParticipantProps
  ): Promise<QuizParticipantModel[]> {
    const options = this._buildFindOptions(findOptions);
    return this._quizParticipantModel.findAll(options);
  }

  public async getQuizParticipantsPagination(
    props: GetPaginationQuizParticipantsProps
  ): Promise<CursorPaginationResult<QuizParticipantModel>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order } = props;

    const findOption = this._buildFindOptions(props);

    const paginator = new CursorPaginator(
      this._quizParticipantModel,
      ['createdAt'],
      { before, after, limit },
      order
    );

    const { rows, meta } = await paginator.paginate(findOption);

    return { rows, meta };
  }

  private _buildFindOptions(
    options: FindQuizParticipantProps
  ): FindOptions<QuizParticipantAttributes> {
    const findOptions: FindOptions<QuizParticipantAttributes> = {};

    findOptions.where = this._buildWhereOptions(options.condition);
    findOptions.include = this._buildRelationOptions(options.include);
    findOptions.attributes = this._buildAttributesOptions(options.attributes);
    findOptions.order = this._buildOrderOptions(options.orderOptions);
    findOptions.group = this._buildGroupOptions(options.group);

    return findOptions;
  }

  private _buildWhereOptions(
    options: FindQuizParticipantConditionOptions = {}
  ): WhereOptions<QuizParticipantAttributes> {
    const whereOptions: WhereOptions<QuizParticipantAttributes> = {};

    const conditions = [];

    if (options.ids) {
      conditions.push({ id: options.ids });
    }

    if (options.contentIds) {
      conditions.push({ postId: options.contentIds });
    }

    if (options.createdBy) {
      conditions.push({ createdBy: options.createdBy });
    }

    if (options.isHighest !== undefined && options.isHighest !== null) {
      conditions.push({ isHighest: options.isHighest });
    }

    if (options.isFinished !== undefined && options.isFinished !== null) {
      if (options.isFinished === true) {
        conditions.push({
          [Op.or]: [
            { finishedAt: { [Op.not]: null } },
            Sequelize.literal(`started_at + time_limit * interval '1 second' <= NOW()`),
          ],
        });
      } else {
        conditions.push({
          [Op.and]: [
            { finishedAt: null },
            Sequelize.literal(`started_at + time_limit * interval '1 second' > NOW()`),
          ],
        });
      }
    }

    if (conditions.length > 0) {
      whereOptions[Op.and] = conditions;
    }

    return whereOptions;
  }

  private _buildRelationOptions(options: FindQuizParticipantIncludeOptions = {}): Includeable[] {
    const relationOptions: Includeable[] = [];

    if (options.shouldInCludeAnswers) {
      relationOptions.push({
        model: this._quizParticipantAnswerModel,
        as: 'answers',
        required: false,
      });
    }

    return relationOptions.length > 0 ? relationOptions : undefined;
  }

  private _buildAttributesOptions(
    options: FindQuizParticipantAttributeOptions = {}
  ): FindAttributeOptions {
    let attributesOptions: FindAttributeOptions | undefined;

    const hasInclude = options.include?.length > 0;
    const hasExclude = options.exclude?.length > 0;

    if (hasInclude && !hasExclude) {
      attributesOptions = options.include;
    }

    if (!hasInclude && hasExclude) {
      attributesOptions = { exclude: options.exclude };
    }

    if (hasInclude && hasExclude) {
      attributesOptions = {
        include: options.include,
        exclude: options.exclude,
      };
    }

    return attributesOptions;
  }

  private _buildOrderOptions(options: FindQuizParticipantOrderOptions = {}): Order {
    const orderOptions = [];

    if (options.sortColumn) {
      orderOptions.push([options.sortColumn, options.sortBy || ORDER.DESC]);
    }

    return orderOptions.length > 0 ? orderOptions : undefined;
  }

  private _buildGroupOptions(options: string[] = []): GroupOption {
    return options.length > 0 ? options : undefined;
  }

  public async bulkCreateQuizParticipantAnswers(
    answers: QuizParticipantAnswerAttributes[]
  ): Promise<void> {
    await this._quizParticipantAnswerModel.bulkCreate(answers);
  }

  public async updateQuizParticipantAnswer(
    answerId: string,
    answer: Partial<QuizParticipantAnswerAttributes>
  ): Promise<void> {
    await this._quizParticipantAnswerModel.update(answer, {
      where: {
        id: answerId,
      },
    });
  }

  public async deleteQuizParticipantAnswer(
    conditions: WhereOptions<QuizParticipantAnswerAttributes>
  ): Promise<void> {
    await this._quizParticipantAnswerModel.destroy({
      where: conditions,
    });
  }

  public async findAllQuizParticipantAnswers(
    quizParticipantId: string
  ): Promise<QuizParticipantAnswerModel[]> {
    return this._quizParticipantAnswerModel.findAll({
      where: {
        quizParticipantId,
      },
    });
  }
}
