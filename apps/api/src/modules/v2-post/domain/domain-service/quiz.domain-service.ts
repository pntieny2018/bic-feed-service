import { cloneDeep } from 'lodash';
import { QuizEntity } from '../model/quiz';
import { QuizStatus } from '../../data-type';
import { Inject, Logger } from '@nestjs/common';
import {
  GetQuizDraftsProps,
  IQuizDomainService,
  QuizCreateProps,
  QuizUpdateProps,
} from './interface/quiz.domain-service.interface';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  public constructor(
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _quizFactory: IQuizFactory,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository
  ) {}

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const quizEntity = this._quizFactory.create(input);
    try {
      await this._quizRepository.create(quizEntity);
      quizEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return quizEntity;
  }

  public async update(quizEntity: QuizEntity, input: QuizUpdateProps): Promise<QuizEntity> {
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

  public async getDrafts(input: GetQuizDraftsProps): Promise<CursorPaginationResult<QuizEntity>> {
    const { authUser } = input;
    return this._quizRepository.getPagination({
      ...input,
      where: {
        createdBy: authUser.id,
        status: QuizStatus.DRAFT,
      },
      attributes: ['id', 'contentId', 'createdAt'],
    });
  }
}
