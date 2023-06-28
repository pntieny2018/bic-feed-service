import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import { IQuizDomainService, QuizCreateProps } from './interface/quiz.domain-service.interface';
import { QuizEntity } from '../model/quiz';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';
import { cloneDeep } from 'lodash';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  @Inject(QUIZ_REPOSITORY_TOKEN)
  private readonly _quizRepository: IQuizRepository;
  @Inject(QUIZ_FACTORY_TOKEN)
  private readonly _quizFactory: IQuizFactory;

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const quizEntity = this._quizFactory.create(input);
    try {
      await this._quizRepository.create(quizEntity);
      quizEntity.commit();
    } catch (e) {
      console.log(e);
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return quizEntity;
  }

  public async update(quizEntity: QuizEntity, input: QuizCreateProps): Promise<QuizEntity> {
    const newQuizEntity = cloneDeep(quizEntity);
    newQuizEntity.updateAttribute(input);
    try {
      await this._quizRepository.update(newQuizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return newQuizEntity;
  }
}
