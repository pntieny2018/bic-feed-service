import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import { TagModel } from '../../../../database/models/tag.model';
import {
  FindAllQuizProps,
  FindOneQuizProps,
  IQuizRepository,
} from '../../domain/repositoty-interface';
import { QuizEntity } from '../../domain/model/quiz';
import { QuizModel } from '../../../../database/models/quiz.model';
import {
  IQuizFactory,
  QUIZ_FACTORY_TOKEN,
} from '../../domain/factory/interface/quiz.factory.interface';

export class QuizRepository implements IQuizRepository {
  @Inject(QUIZ_FACTORY_TOKEN) private readonly _factory: IQuizFactory;
  private _logger = new Logger(QuizRepository.name);
  @InjectModel(QuizModel)
  private readonly _quizModel: typeof QuizModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

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
    const findOptions: FindOptions = {
      where: {},
    };
    if (input.id) {
      findOptions.where['id'] = input.id;
    }
    const entity = await this._quizModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  public async findAll(input: FindAllQuizProps): Promise<QuizEntity[]> {
    const findOptions: FindOptions = {
      where: {},
    };
    if (input.contentId) {
      findOptions.where['contentId'] = input.contentId;
    }

    if (input.status) {
      findOptions.where['status'] = input.status;
    }
    const rows = await this._quizModel.findAll(findOptions);
    return rows.map((row) => this._modelToEntity(row));
  }

  private _modelToEntity(quiz: QuizModel): QuizEntity {
    if (quiz === null) return null;
    return this._factory.reconstitute(quiz.toJSON());
  }
}
