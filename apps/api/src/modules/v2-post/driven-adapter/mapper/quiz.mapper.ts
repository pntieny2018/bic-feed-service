import { QUIZ_STATUS } from '@beincom/constants';
import { QUIZ_PROCESS_STATUS } from '@beincom/constants/lib/content';
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
      questions: model.questions
        ? model.questions.map(
            (question) =>
              new QuizQuestionEntity({
                id: question.id,
                quizId: question.quizId,
                content: question.content,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
                answers: question.answers.map((answer) => ({
                  id: answer.id,
                  content: answer.content,
                  isCorrect: answer.isCorrect,
                  createdAt: answer.createdAt,
                  updatedAt: answer.updatedAt,
                })),
              })
          )
        : undefined,
      meta: model.meta,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  public toPersistence(entity: QuizEntity): QuizAttributes {
    return {
      id: entity.get('id'),
      title: entity.get('title'),
      postId: entity.get('contentId'),
      description: entity.get('description'),
      numberOfQuestions: entity.get('numberOfQuestions'),
      numberOfAnswers: entity.get('numberOfAnswers'),
      numberOfQuestionsDisplay: entity.get('numberOfQuestionsDisplay'),
      timeLimit: entity.get('timeLimit'),
      status: entity.get('status') as QUIZ_STATUS,
      genStatus: entity.get('genStatus') as QUIZ_PROCESS_STATUS,
      error: entity.get('error'),
      isRandom: entity.get('isRandom'),
      createdBy: entity.get('createdBy'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      meta: entity.get('meta'),
    };
  }
}
