import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

import { AddQuestionProps } from '../domain-service/interface';
import { QuizEntity, QuizQuestionEntity, QuizAttributes } from '../model/quiz';

import { IQuizFactory } from './interface/quiz.factory.interface';

export class QuizFactory implements IQuizFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createQuizQuestion(addQuizQuestionProps: AddQuestionProps): QuizQuestionEntity {
    const { quizId, content, answers } = addQuizQuestionProps;
    return new QuizQuestionEntity({
      id: v4(),
      quizId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      answers: answers.map((answer) => ({
        id: v4(),
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });
  }

  public reconstitute(properties: QuizAttributes): QuizEntity {
    return new QuizEntity(properties);
  }
}
