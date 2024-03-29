import { v4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IQuizFactory } from './interface/quiz.factory.interface';
import { QuizEntity, QuizProps, QuizQuestionEntity } from '../model/quiz';
import {
  AddQuestionProps,
  QuizCreateProps,
} from '../domain-service/interface/quiz.domain-service.interface';
import { QuizGenStatus, QuizStatus } from '../../data-type/quiz-status.enum';
import { QuizParticipantEntity } from '../model/quiz-participant';
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

  public createTakeQuiz(userId: string, quizEntity: QuizEntity): QuizParticipantEntity {
    const now = new Date();
    const quizParticipant = new QuizParticipantEntity({
      id: v4(),
      quizId: quizEntity.get('id'),
      contentId: quizEntity.get('contentId'),
      quizSnapshot: {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        questions: quizEntity.get('questions').map((question) => ({
          id: question.get('id'),
          content: question.get('content'),
          createdAt: question.get('createdAt'),
          updatedAt: question.get('updatedAt'),
          answers: question.get('answers').map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          })),
        })),
      },
      score: 0,
      isHighest: false,
      timeLimit: quizEntity.get('timeLimit'),
      answers: [],
      totalAnswers: 0,
      totalCorrectAnswers: 0,
      startedAt: now,
      finishedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return this._eventPublisher.mergeObjectContext(quizParticipant);
  }

  public reconstitute(properties: QuizProps): QuizEntity {
    return new QuizEntity(properties);
  }
}
