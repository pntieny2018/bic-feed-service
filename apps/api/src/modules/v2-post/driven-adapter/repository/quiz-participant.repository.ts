import { InjectModel } from '@nestjs/sequelize';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { IQuizParticipantRepository } from '../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantAnswerModel } from '../../../../database/models/quiz-participant-answers.model';
import {
  IQuizParticipant,
  QuizParticipantModel,
} from '../../../../database/models/quiz-participant.model';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { difference } from 'lodash';

export class QuizParticipantRepository implements IQuizParticipantRepository {
  public constructor(
    @InjectModel(QuizParticipantAnswerModel)
    private readonly _quizParticipantAnswerModel: typeof QuizParticipantAnswerModel,

    @InjectModel(QuizParticipantModel)
    private readonly _quizParticipantModel: typeof QuizParticipantModel
  ) {}

  public async create(quizParticipant: QuizParticipantEntity): Promise<void> {
    await this._quizParticipantModel.create({
      id: quizParticipant.get('id'),
      quizId: quizParticipant.get('quizId'),
      postId: quizParticipant.get('contentId'),
      quizSnapshot: {
        title: quizParticipant.get('quizSnapshot').title,
        description: quizParticipant.get('quizSnapshot').description,
        questions: quizParticipant.get('quizSnapshot').questions.map((question) => ({
          id: question.id,
          content: question.content,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
          })),
        })),
      },
      score: quizParticipant.get('score'),
      timeLimit: quizParticipant.get('timeLimit'),
      totalAnswers: quizParticipant.get('totalAnswers'),
      totalCorrectAnswers: quizParticipant.get('totalCorrectAnswers'),
      startedAt: quizParticipant.get('startedAt'),
      finishedAt: quizParticipant.get('finishedAt'),
      createdBy: quizParticipant.get('createdBy'),
      updatedBy: quizParticipant.get('updatedBy'),
      createdAt: quizParticipant.get('createdAt'),
      updatedAt: quizParticipant.get('updatedAt'),
    });
  }

  public async update(quizParticipant: QuizParticipantEntity): Promise<void> {
    await this._quizParticipantModel.update(
      {
        score: quizParticipant.get('score'),
        totalAnswers: quizParticipant.get('totalAnswers'),
        totalCorrectAnswers: quizParticipant.get('totalCorrectAnswers'),
        startedAt: quizParticipant.get('startedAt'),
        finishedAt: quizParticipant.get('finishedAt'),
        updatedBy: quizParticipant.get('updatedBy'),
        updatedAt: quizParticipant.get('updatedAt'),
      },
      {
        where: {
          id: quizParticipant.get('id'),
        },
      }
    );
    if (quizParticipant.get('answers') !== undefined) {
      const currentAnswers = await this._quizParticipantAnswerModel.findAll({
        where: {
          quizParticipantId: quizParticipant.get('id'),
        },
      });
      const newAnswerIds = quizParticipant.get('answers').map((answer) => answer.id);
      const currentAnswerIds = currentAnswers.map((answer) => answer.get('id'));
      for (const currentAnswer of currentAnswers) {
        const findAnswer = quizParticipant
          .get('answers')
          .find((newAnswer) => newAnswer.id === currentAnswer.get('id'));
        if (findAnswer && findAnswer.isCorrect !== currentAnswer.get('isCorrect')) {
          await this._quizParticipantAnswerModel.update(
            {
              isCorrect: findAnswer.isCorrect,
            },
            {
              where: {
                id: findAnswer.id,
              },
            }
          );
        }
      }

      await this._quizParticipantAnswerModel.destroy({
        where: {
          quizParticipantId: quizParticipant.get('id'),
          id: difference(currentAnswerIds, newAnswerIds),
        },
      });

      await this._quizParticipantAnswerModel.bulkCreate(
        quizParticipant
          .get('answers')
          .filter((answer) => !currentAnswerIds.includes(answer.id))
          .map((answer) => ({
            id: answer.id,
            quizParticipantId: quizParticipant.get('id'),
            questionId: answer.questionId,
            answerId: answer.answerId,
            isCorrect: answer.isCorrect,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          }))
      );
    }
  }

  public async findOne(takeId: string): Promise<QuizParticipantEntity> {
    const takeQuizModel = await this._quizParticipantModel.findOne({
      include: [
        {
          model: QuizParticipantAnswerModel,
          as: 'answers',
          required: false,
        },
      ],
      where: {
        id: takeId,
      },
    });

    return this._modelToEntity(takeQuizModel);
  }

  public async getQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._quizParticipantModel.findAll({
      where: {
        postId: contentIds,
        createdBy: userId,
        [Op.and]: Sequelize.literal(
          `finished_at is NOT null OR started_at + time_limit * interval '1 second' <= now()`
        ),
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      if (
        !contentIdsMapHighestScore.has(contentId) ||
        contentIdsMapHighestScore.get(contentId).get('score') < row.score
      ) {
        contentIdsMapHighestScore.set(contentId, this._modelToEntity(row));
      }
    });
    return contentIdsMapHighestScore;
  }

  public async getQuizParticipantsDoingGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._quizParticipantModel.findAll({
      where: {
        postId: contentIds,
        createdBy: userId,
        [Op.and]: Sequelize.literal(
          `finished_at is null AND started_at + time_limit * interval '1 second' > now()`
        ),
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      contentIdsMapHighestScore.set(contentId, this._modelToEntity(row));
    });
    return contentIdsMapHighestScore;
  }

  public async findAllByContentId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity[]> {
    const rows = await this._quizParticipantModel.findAll({
      include: [
        {
          model: this._quizParticipantAnswerModel,
          required: false,
        },
      ],
      where: {
        postId: contentId,
        createdBy: userId,
      },
    });

    return rows.map((row) => this._modelToEntity(row));
  }

  private _modelToEntity(takeQuizModel: IQuizParticipant): QuizParticipantEntity {
    return new QuizParticipantEntity({
      id: takeQuizModel.id,
      contentId: takeQuizModel.postId,
      quizId: takeQuizModel.quizId,
      quizSnapshot: takeQuizModel.quizSnapshot,
      score: takeQuizModel.score,
      timeLimit: takeQuizModel.timeLimit,
      totalAnswers: takeQuizModel.totalAnswers,
      totalCorrectAnswers: takeQuizModel.totalCorrectAnswers,
      startedAt: takeQuizModel.startedAt,
      finishedAt: takeQuizModel.finishedAt,
      createdBy: takeQuizModel.createdBy,
      updatedBy: takeQuizModel.updatedBy,
      createdAt: takeQuizModel.createdAt,
      updatedAt: takeQuizModel.updatedAt,
      answers: takeQuizModel.answers,
    });
  }
}
