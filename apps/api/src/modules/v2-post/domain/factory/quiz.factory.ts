import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IQuizFactory } from './interface/quiz.factory.interface';
import { QuizEntity, QuizProps } from '../model/quiz';

export class QuizFactory implements IQuizFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public create(options: any): QuizEntity {
    const { name, groupId, userId } = options;
    const now = new Date();
    const quizEntity = new QuizEntity({
      id: v4(),
      title: 'title',
      description: 'description',
      numQuestion: 10,
      numAnswer: 4,
      numQuestionDisplay: 10,
      numAnswerDisplay: 4,
      isRandom: true,
      questions: [],
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(quizEntity);
  }

  public reconstitute(properties: QuizProps): QuizEntity {
    return new QuizEntity(properties);
  }
}
