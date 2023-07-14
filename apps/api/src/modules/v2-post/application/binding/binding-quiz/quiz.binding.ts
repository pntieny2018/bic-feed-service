import { Injectable } from '@nestjs/common';
import { QuizDto } from '../../dto';
import { QuizEntity } from '../../../domain/model/quiz';
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
      numberOfAnswersDisplay: entity.get('numberOfAnswersDisplay'),
      isRandom: entity.get('isRandom'),
      error: entity.get('error'),
      questions: entity.get('questions').map((question) => ({
        id: question.id,
        question: question.question,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          answer: answer.answer,
          isCorrect: answer.isCorrect || undefined,
        })),
      })),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
    });
  }
}
