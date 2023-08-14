import { QuizParticipantAnswerModel } from '@libs/database/postgres/model/quiz-participant-answers.model';
import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '@libs/database/postgres/model/quiz-participant.model';
import { ILibQuizParticipantRepository } from '@libs/database/postgres/repository/interface';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

export class LibQuizParticipantRepository implements ILibQuizParticipantRepository {
  public constructor(
    @InjectModel(QuizParticipantAnswerModel)
    private readonly _quizParticipantAnswerModel: typeof QuizParticipantAnswerModel,

    @InjectModel(QuizParticipantModel)
    private readonly _quizParticipantModel: typeof QuizParticipantModel
  ) {}

  public async create(quizParticipant: QuizParticipantAttributes): Promise<void> {
    await this._quizParticipantModel.create(quizParticipant);
  }

  public async update(
    quizParticipantId: string,
    quizParticipant: Partial<QuizParticipantAttributes>
  ): Promise<void> {
    await this._quizParticipantModel.update(quizParticipant, {
      where: {
        id: quizParticipantId,
      },
    });
    if (quizParticipant?.answers) {
      await this._quizParticipantAnswerModel.destroy({
        where: {
          quizParticipantId,
        },
      });
      await this._quizParticipantAnswerModel.bulkCreate(
        quizParticipant.answers.map((answer) => ({
          id: answer.id,
          quizParticipantId,
          questionId: answer.questionId,
          answerId: answer.answerId,
          isCorrect: answer.isCorrect,
          createdAt: answer.createdAt,
          updatedAt: answer.updatedAt,
        }))
      );
    }
  }

  public async findOne(takeId: string): Promise<QuizParticipantModel> {
    return this._quizParticipantModel.findOne({
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
  }

  public async getQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantModel>> {
    const rows = await this._quizParticipantModel.findAll({
      where: {
        postId: contentIds,
        createdBy: userId,
        [Op.and]: Sequelize.literal(
          `finished_at is NOT null OR started_at + time_limit * interval '1 second' <= now()`
        ),
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantModel>();
    rows.forEach((row) => {
      const contentId = row.postId;
      if (
        !contentIdsMapHighestScore.has(contentId) ||
        contentIdsMapHighestScore.get(contentId).get('score') < row.score
      ) {
        contentIdsMapHighestScore.set(contentId, row);
      }
    });
    return contentIdsMapHighestScore;
  }

  public async getQuizParticipantsDoingGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantModel>> {
    const rows = await this._quizParticipantModel.findAll({
      where: {
        postId: contentIds,
        createdBy: userId,
        [Op.and]: Sequelize.literal(
          `finished_at is null AND started_at + time_limit * interval '1 second' > now()`
        ),
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantModel>();
    rows.forEach((row) => {
      const contentId = row.postId;
      contentIdsMapHighestScore.set(contentId, row);
    });
    return contentIdsMapHighestScore;
  }

  public async findAllByContentId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantModel[]> {
    return this._quizParticipantModel.findAll({
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
  }
}
