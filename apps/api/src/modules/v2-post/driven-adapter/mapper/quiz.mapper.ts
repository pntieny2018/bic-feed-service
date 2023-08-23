import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { QuizAttributes, QuizModel } from '@libs/database/postgres/model/quiz.model';
import { Inject, Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

import { QuizGenStatus, QuizStatus } from '../../data-type';
import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';

@Injectable()
export class QuizMapper {
  public constructor(@Inject(EventPublisher) private readonly _eventPublisher: EventPublisher) {}

  public toDomain(model: QuizModel): QuizEntity {
    if (model === null) {
      return null;
    }
    return this._eventPublisher.mergeObjectContext(
      new QuizEntity({
        id: model.id,
        title: model.title,
        contentId: model.postId,
        status: model.status as unknown as QuizStatus,
        genStatus: model.genStatus as unknown as QuizGenStatus,
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
        createdBy: model.createdBy,
        updatedBy: model.updatedBy,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })
    );
  }

  public toPersistence(entity: QuizEntity): QuizAttributes {
    return {
      id: entity.get('id'),
      description: entity.get('description'),
      error: entity.get('error'),
      genStatus: entity.get('genStatus') as unknown as QUIZ_PROCESS_STATUS,
      isRandom: entity.get('isRandom'),
      meta: entity.get('meta'),
      numberOfAnswers: entity.get('numberOfAnswers'),
      numberOfQuestions: entity.get('numberOfQuestions'),
      numberOfQuestionsDisplay: entity.get('numberOfQuestionsDisplay'),
      postId: entity.get('contentId'),
      status: entity.get('status') as unknown as QUIZ_STATUS,
      timeLimit: entity.get('timeLimit'),
      title: entity.get('title'),
      updatedAt: entity.get('updatedAt'),
      updatedBy: entity.get('updatedBy'),
      createdAt: entity.get('createdAt'),
      createdBy: entity.get('createdBy'),
    };
  }
}
