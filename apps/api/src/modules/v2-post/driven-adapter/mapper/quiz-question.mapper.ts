import {
  QuizQuestionAttributes,
  QuizQuestionModel,
} from '@libs/database/postgres/model/quiz-question.model';
import { Injectable } from '@nestjs/common';

import { QuizQuestionEntity } from '../../domain/model/quiz';

@Injectable()
export class QuizQuestionMapper {
  public toDomain(model: QuizQuestionModel): QuizQuestionEntity {
    if (model === null) {
      return null;
    }

    return new QuizQuestionEntity({
      id: model.id,
      content: model.content,
      quizId: model.quizId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      answers: model.answers.map((answer) => ({
        id: answer.id,
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })),
    });
  }

  public toPersistence(entity: QuizQuestionEntity): QuizQuestionAttributes {
    return {
      id: entity.get('id'),
      quizId: entity.get('quizId'),
      content: entity.get('content'),
      answers: entity.get('answers').map((answer) => ({
        id: answer.id,
        questionId: entity.get('id'),
        content: answer.content,
        isCorrect: answer.isCorrect,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
      })),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    };
  }
}
