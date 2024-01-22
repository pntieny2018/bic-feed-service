import { QuizDto } from '@api/modules/v2-post/application/dto';
import { QuizAttributes, QuizModel } from '@libs/database/postgres/model/quiz.model';
import { Injectable } from '@nestjs/common';

import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';

@Injectable()
export class QuizMapper {
  public toDomain(model: QuizModel): QuizEntity {
    if (model === null) {
      return null;
    }
    return new QuizEntity({
      id: model.id,
      title: model.title,
      contentId: model.postId,
      status: model.status,
      genStatus: model.genStatus,
      description: model.description,
      numberOfQuestions: model.numberOfQuestions,
      numberOfAnswers: model.numberOfAnswers,
      numberOfQuestionsDisplay: model.numberOfQuestionsDisplay,
      timeLimit: model.timeLimit,
      isRandom: model.isRandom,
      questions: (model.questions || []).map(
        (question) =>
          new QuizQuestionEntity({
            id: question.id,
            quizId: model.id,
            content: question.content,
            answers: question.answers.map((answer) => ({
              id: answer.id,
              content: answer.content,
              isCorrect: answer.isCorrect,
              createdAt: answer.createdAt,
              updatedAt: answer.updatedAt,
            })),
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          })
      ),
      meta: model.meta,
      error: model.error,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  public toPersistence(entity: QuizEntity): QuizAttributes {
    return {
      id: entity.get('id'),
      postId: entity.get('contentId'),
      title: entity.get('title'),
      description: entity.get('description'),
      timeLimit: entity.get('timeLimit'),
      numberOfQuestions: entity.get('numberOfQuestions'),
      numberOfAnswers: entity.get('numberOfAnswers'),
      numberOfQuestionsDisplay: entity.get('numberOfQuestionsDisplay'),
      isRandom: entity.get('isRandom'),
      meta: entity.get('meta'),
      status: entity.get('status'),
      genStatus: entity.get('genStatus'),
      error: entity.get('error'),
      updatedAt: entity.get('updatedAt'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      createdBy: entity.get('createdBy'),
      questions: (entity.get('questions') || []).map((question) => ({
        id: question.get('id'),
        quizId: entity.get('id'),
        content: question.get('content'),
        answers: (question.get('answers') || []).map((answer) => ({
          id: answer.id,
          questionId: question.get('id'),
          content: answer.content,
          isCorrect: answer.isCorrect,
          createdAt: answer.createdAt,
          updatedAt: answer.updatedAt,
        })),
        createdAt: question.get('createdAt'),
        updatedAt: question.get('updatedAt'),
      })),
    };
  }

  public toDto(entity: QuizEntity): QuizDto {
    return new QuizDto({
      id: entity.get('id'),
      contentId: entity.get('contentId'),
      status: entity.get('status'),
      genStatus: entity.get('genStatus'),
      title: entity.get('title'),
      description: entity.get('description'),
      numberOfQuestions: entity.get('numberOfQuestions'),
      numberOfQuestionsDisplay: entity.get('numberOfQuestionsDisplay'),
      numberOfAnswers: entity.get('numberOfAnswers'),
      isRandom: entity.get('isRandom'),
      error: entity.get('error'),
      timeLimit: entity.get('timeLimit'),
      createdBy: entity.get('createdBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    });
  }
}
