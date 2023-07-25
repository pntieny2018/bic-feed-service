import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IQuizFactory } from './interface/quiz.factory.interface';
import { QuizEntity, QuizProps } from '../model/quiz';
import { QuizCreateProps } from '../domain-service/interface/quiz.domain-service.interface';
import { QuizGenStatus, QuizStatus } from '../../data-type/quiz-status.enum';
import { TakeQuizEntity } from '../model/user-taking-quiz';
import { RULES } from '../../constant';

export class QuizFactory implements IQuizFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createQuiz(options: QuizCreateProps): QuizEntity {
    const {
      authUser,
      title,
      description,
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
      timeLimit: RULES.QUIZ_TIME_LIMIT_DEFAULT,
      questions: [],
      meta,
      status: QuizStatus.DRAFT,
      genStatus: QuizGenStatus.PENDING,
      createdBy: authUser.id,
      updatedBy: authUser.id,
      createdAt: now,
      updatedAt: now,
    });

    return this._eventPublisher.mergeObjectContext(quizEntity);
  }

  public createTakeQuiz(userId: string, quizEntity: QuizEntity): TakeQuizEntity {
    const now = new Date();
    const takeQuizEntity = new TakeQuizEntity({
      id: v4(),
      quizId: quizEntity.get('id'),
      contentId: quizEntity.get('contentId'),
      quizSnapshot: {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        questions: quizEntity.get('questions'),
      },
      score: 0,
      timeLimit: quizEntity.get('timeLimit'),
      totalQuestionsCompleted: 0,
      startedAt: now,
      finishedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return this._eventPublisher.mergeObjectContext(takeQuizEntity);
  }

  public reconstitute(properties: QuizProps): QuizEntity {
    return new QuizEntity(properties);
  }
}
