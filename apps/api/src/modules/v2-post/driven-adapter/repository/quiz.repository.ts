import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import { TagModel } from '../../../../database/models/tag.model';
import { FindOneQuizProps, IQuizRepository } from '../../domain/repositoty-interface';
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
      description: data.get('description'),
      numQuestion: data.get('numQuestion'),
      numAnswer: data.get('numAnswer'),
      numQuestionDisplay: data.get('numQuestionDisplay'),
      numAnswerDisplay: data.get('numAnswerDisplay'),
      isRandom: data.get('isRandom'),
      questions: data.get('questions'),
      createdBy: data.get('createdBy'),
      updatedBy: data.get('updatedBy'),
      createdAt: data.get('createdAt'),
      updatedAt: data.get('updatedAt'),
    });
  }

  public async update(data: QuizEntity): Promise<void> {
    await this._quizModel.update(
      {
        title: data.get('title'),
      },
      { where: { id: data.get('id') } }
    );
  }

  public async delete(id: string): Promise<void> {
    await this._quizModel.destroy({ where: { id: id } });
  }

  public async findOne(input: FindOneQuizProps): Promise<QuizEntity> {
    const findOptions: FindOptions = {
      attributes: TagModel.loadAllAttributes(),
      where: {},
    };
    if (input.id) {
      findOptions.where['id'] = input.id;
    }
    const entity = await this._quizModel.findOne(findOptions);
    return this._modelToEntity(entity);
  }

  private _modelToEntity(quiz: QuizModel): QuizEntity {
    if (quiz === null) return null;
    return this._factory.reconstitute(quiz.toJSON());
  }
}
