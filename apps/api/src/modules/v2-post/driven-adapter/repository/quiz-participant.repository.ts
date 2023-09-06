import { ORDER } from '@beincom/constants';
import {
  ILibQuizParticipantRepository,
  LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '@libs/database/postgres';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { difference } from 'lodash';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { CursorPaginator } from '../../../../common/dto';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { QuizParticipantAnswerModel } from '../../../../database/models/quiz-participant-answers.model';
import {
  IQuizParticipant,
  QuizParticipantModel,
} from '../../../../database/models/quiz-participant.model';
import { QuizParticipantNotFoundException } from '../../domain/exception';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { IQuizParticipantRepository } from '../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantMapper } from '../mapper/quiz-participant.mapper';

export class QuizParticipantRepository implements IQuizParticipantRepository {
  public constructor(
    @Inject(LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _libQuizParticipantRepo: ILibQuizParticipantRepository,

    private readonly _quizParticipantMapper: QuizParticipantMapper,

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
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
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

  public async updateIsHighest(quizParticipantId: string, isHighest: boolean): Promise<void> {
    await this._quizParticipantModel.update({ isHighest }, { where: { id: quizParticipantId } });
  }

  public async findQuizParticipantById(
    quizParticipantId: string
  ): Promise<QuizParticipantEntity | null> {
    const quizParticipant = await this._libQuizParticipantRepo.findQuizParticipant({
      condition: { ids: [quizParticipantId] },
      include: { shouldInCludeAnswers: true },
    });

    if (!quizParticipant) {
      return null;
    }

    return this._quizParticipantMapper.toDomain(quizParticipant);
  }

  public async getQuizParticipantById(quizParticipantId: string): Promise<QuizParticipantEntity> {
    const quizParticipantEntity = await this.findQuizParticipantById(quizParticipantId);

    if (!quizParticipantEntity) {
      throw new QuizParticipantNotFoundException();
    }

    return quizParticipantEntity;
  }

  public async findQuizParticipantHighestScoreByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity> {
    const quizParticipant = await this._quizParticipantModel.findOne({
      where: {
        postId: contentId,
        createdBy: userId,
        isHighest: true,
      },
    });

    if (!quizParticipant) {
      return null;
    }

    return this._modelToEntity(quizParticipant);
  }

  public async getHighestScoreOfMember(
    contentId: string
  ): Promise<{ createdBy: string; score: number }[]> {
    const rows = await this._quizParticipantModel.findAll({
      attributes: ['createdBy', [Sequelize.fn('max', Sequelize.col('score')), 'score']],
      where: {
        postId: contentId,
        [Op.or]: [
          { finishedAt: { [Op.not]: null } },
          Sequelize.literal(`started_at + time_limit * interval '1 second' <= NOW()`),
        ],
      },
      group: ['created_by'],
    });

    return rows.map((row) => row.toJSON());
  }

  public async getQuizParticipantHighestScoreGroupByUserId(
    contentId: string,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<QuizParticipantEntity>> {
    const { limit = PAGING_DEFAULT_LIMIT, before, after, order = ORDER.DESC } = paginationProps;

    const paginator = new CursorPaginator(
      this._quizParticipantModel,
      ['createdAt'],
      { before, after, limit },
      order
    );

    const { rows, meta } = await paginator.paginate({
      where: {
        postId: contentId,
        isHighest: true,
        [Op.or]: [
          { finishedAt: { [Op.not]: null } },
          Sequelize.literal(`started_at + time_limit * interval '1 second' <= NOW()`),
        ],
      },
    });

    return {
      rows: rows.map((row) => this._modelToEntity(row)),
      meta,
    };
  }

  public async getQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._quizParticipantModel.findAll({
      where: {
        postId: contentIds,
        createdBy: userId,
        isHighest: true,
        finishedAt: {
          [Op.ne]: null,
        },
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      if (!contentIdsMapHighestScore.has(contentId)) {
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
    const quizParticipants = await this._libQuizParticipantRepo.findAllQuizParticipants({
      condition: { contentIds: [contentId], createdBy: userId },
      include: { shouldInCludeAnswers: true },
    });

    return quizParticipants.map((quizParticipant) =>
      this._quizParticipantMapper.toDomain(quizParticipant)
    );
  }

  private _modelToEntity(takeQuizModel: IQuizParticipant): QuizParticipantEntity {
    return new QuizParticipantEntity({
      id: takeQuizModel.id,
      contentId: takeQuizModel.postId,
      quizId: takeQuizModel.quizId,
      quizSnapshot: takeQuizModel.quizSnapshot,
      score: takeQuizModel.score,
      isHighest: takeQuizModel.isHighest,
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
