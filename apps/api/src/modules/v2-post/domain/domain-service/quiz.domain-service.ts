import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import { IQuizDomainService, QuizCreateProps } from './interface/quiz.domain-service.interface';
import { QuizEntity } from '../model/quiz';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  @Inject(QUIZ_REPOSITORY_TOKEN)
  private readonly _quizRepository: IQuizRepository;
  @Inject(QUIZ_FACTORY_TOKEN)
  private readonly _quizFactory: IQuizFactory;

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const {} = input;
    const tagEntity = this._quizFactory.create(input);
    try {
      await this._quizRepository.create(tagEntity);
      tagEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return tagEntity;
  }
}
