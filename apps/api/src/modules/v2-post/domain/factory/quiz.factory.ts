import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IQuizFactory } from './interface/quiz.factory.interface';
import { QuizEntity, QuizProps } from '../model/quiz';
import { QuizCreateProps } from '../domain-service/interface/quiz.domain-service.interface';
import { QuizStatus } from '../../data-type/quiz-status.enum';

export class QuizFactory implements IQuizFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: QuizCreateProps): QuizEntity {
    const {
      authUser,
      title,
      description,
      questions,
      contentId,
      isRandom,
      numberOfAnswers,
      numberOfQuestions,
      numberOfAnswersDisplay,
      numberOfQuestionsDisplay,
      meta,
    } = options;
    const now = new Date();
    const quizEntity = new QuizEntity({
      id: v4(),
      contentId,
      title: title || null,
      description: description || null,
      numberOfQuestions,
      numberOfQuestionsDisplay: numberOfQuestionsDisplay || numberOfQuestions,
      numberOfAnswers,
      numberOfAnswersDisplay: numberOfAnswersDisplay || numberOfAnswers,
      isRandom: isRandom || true,
      questions: questions || [],
      meta,
      status: QuizStatus.DRAFT,
      createdBy: authUser.id,
      updatedBy: authUser.id,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(quizEntity);
  }

  public reconstitute(properties: QuizProps): QuizEntity {
    return new QuizEntity(properties);
  }
}
