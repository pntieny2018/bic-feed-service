import { Injectable } from '@nestjs/common';

import { QuizEntity, QuizQuestionEntity } from '../../../domain/model/quiz';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuestionDto, QuizDto, QuizParticipantDto } from '../../dto';

import { IQuizBinding } from './quiz.interface';

@Injectable()
export class QuizBinding implements IQuizBinding {
  public async binding(entity: QuizEntity): Promise<QuizDto> {
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
      questions: entity.get('questions').map((question) => ({
        id: question.get('id'),
        content: question.get('content'),
        answers: question.get('answers').map((answer) => ({
          id: answer.id,
          content: answer.content,
          isCorrect: answer.isCorrect,
        })),
      })),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    });
  }

  public async bindQuizParticipants(
    quizParticipantEntities: QuizParticipantEntity[]
  ): Promise<QuizParticipantDto[]> {
    return quizParticipantEntities.map((quizParticipantEntity) => ({
      id: quizParticipantEntity.get('id'),
      title: quizParticipantEntity.get('quizSnapshot').title,
      description: quizParticipantEntity.get('quizSnapshot').description,
      questions: quizParticipantEntity.get('quizSnapshot').questions.map((question) => ({
        id: question.id,
        content: question.content,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          content: answer.content,
        })),
      })),
      userAnswers: quizParticipantEntity.get('answers').map((answer) => ({
        questionId: answer.questionId,
        answerId: answer.answerId,
      })),
      quizId: quizParticipantEntity.get('quizId'),
      score: quizParticipantEntity.get('score'),
      isHighest: quizParticipantEntity.get('isHighest'),
      totalAnswers: quizParticipantEntity.get('totalAnswers'),
      totalCorrectAnswers: quizParticipantEntity.get('totalCorrectAnswers'),
      finishedAt: quizParticipantEntity.get('finishedAt'),
      timeLimit: quizParticipantEntity.get('timeLimit'),
      startedAt: quizParticipantEntity.get('startedAt'),
      createdAt: quizParticipantEntity.get('createdAt'),
      updatedAt: quizParticipantEntity.get('updatedAt'),
    }));
  }

  public async bindQuizQuestion(question: QuizQuestionEntity): Promise<QuestionDto> {
    return new QuestionDto({
      id: question.get('id'),
      content: question.get('content'),
      answers: question.get('answers').map((answer) => ({
        id: answer.id,
        content: answer.content,
        isCorrect: answer.isCorrect,
      })),
    });
  }
}
