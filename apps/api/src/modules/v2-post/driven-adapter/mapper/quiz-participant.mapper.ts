import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '@libs/database/postgres/model/quiz-participant.model';
import { Injectable } from '@nestjs/common';

import { QuizParticipantEntity } from '../../domain/model/quiz-participant';

@Injectable()
export class QuizParticipantMapper {
  public toDomain(model: QuizParticipantModel): QuizParticipantEntity {
    if (model === null) {
      return null;
    }
    return new QuizParticipantEntity({
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
    });
  }

  public toPersistence(entity: QuizParticipantEntity): QuizParticipantAttributes {
    return {
      id: entity.get('id'),
      quizId: entity.get('quizId'),
      postId: entity.get('contentId'),
      quizSnapshot: {
        title: entity.get('quizSnapshot').title,
        description: entity.get('quizSnapshot').description,
        questions: entity.get('quizSnapshot').questions.map((question) => ({
          id: question.id,
          content: question.content,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          })),
        })),
      },
      answers: [],
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
