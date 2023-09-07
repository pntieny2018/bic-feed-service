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
import {
  FindQuizParticipantAttributeOptions,
  FindQuizParticipantConditionOptions,
  FindQuizParticipantIncludeOptions,
  FindQuizParticipantOrderOptions,
  FindQuizParticipantProps,
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

  private _buildFindOptions(
    options: FindQuizParticipantProps
  ): FindOptions<QuizParticipantAttributes> {
    const findOptions: FindOptions<QuizParticipantAttributes> = {};

    findOptions.where = this._buildWhereOptions(options.condition);
    findOptions.include = this._buildRelationOptions(options.include);
    findOptions.attributes = this._buildAttributesOptions(options.attributes);
    findOptions.order = this._buildOrderOptions(options.order);
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

    if (conditions.length > 0) {
      whereOptions[Op.and] = conditions;
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
          [Op.or]: [
            { finishedAt: null },
            Sequelize.literal(`started_at + time_limit * interval '1 second' > NOW()`),
          ],
        });
      }
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

    return relationOptions;
  }

  private _buildAttributesOptions(
    options: FindQuizParticipantAttributeOptions = {}
  ): FindAttributeOptions {
    let attributesOptions: FindAttributeOptions;

    if (options.exclude?.length > 0) {
      attributesOptions['exclude'] = options.exclude;
    }

    if (options.include) {
      attributesOptions['include'] = options.include;
    }

    return attributesOptions;
  }

  private _buildOrderOptions(options: FindQuizParticipantOrderOptions = {}): Order {
    const orderOptions = [];

    if (options.sortColumn) {
      orderOptions.push([options.sortColumn, options.sortBy || ORDER.DESC]);
    }

    return orderOptions;
  }

  private _buildGroupOptions(options: string[] = []): GroupOption {
    return options;
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
