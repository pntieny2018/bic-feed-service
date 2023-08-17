import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '@libs/database/postgres/model/quiz-participant.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { QuizParticipantEntity } from '../../domain/model/quiz-participant';

@Injectable()
export class QuizParticipantMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: QuizParticipantModel): QuizParticipantEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(
      new QuizParticipantEntity({
        id: model.id,
        contentId: model.postId,
        quizId: model.quizId,
        quizSnapshot: model.quizSnapshot,
        score: model.score,
        isHighest: model.isHighest,
        timeLimit: model.timeLimit,
        totalAnswers: model.totalAnswers,
        totalCorrectAnswers: model.totalCorrectAnswers,
        startedAt: model.startedAt,
        finishedAt: model.finishedAt,
        createdBy: model.createdBy,
        updatedBy: model.updatedBy,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        answers: model.answers,
      })
    );
  }

  public toPersistence(entity: QuizParticipantEntity): QuizParticipantAttributes {
    return {
      answers: [],
      id: entity.get('id'),
      postId: entity.get('contentId'),
      quizId: entity.get('quizId'),
      quizSnapshot: entity.get('quizSnapshot'),
      score: entity.get('score'),
      isHighest: entity.get('isHighest'),
      timeLimit: entity.get('timeLimit'),
      totalAnswers: entity.get('totalAnswers'),
      totalCorrectAnswers: entity.get('totalCorrectAnswers'),
      startedAt: entity.get('startedAt'),
      finishedAt: entity.get('finishedAt'),
      createdBy: entity.get('createdBy'),
      updatedBy: entity.get('updatedBy'),
      updatedAt: entity.get('updatedAt'),
      createdAt: entity.get('createdAt'),
    };
  }
}
