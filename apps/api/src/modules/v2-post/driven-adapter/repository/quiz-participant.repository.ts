import { ORDER } from '@beincom/constants';
import {
  ILibQuizParticipantRepository,
  LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject } from '@nestjs/common';
import { difference } from 'lodash';
import { Sequelize } from 'sequelize-typescript';

import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { QuizParticipantNotFoundException } from '../../domain/exception';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { IQuizParticipantRepository } from '../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizParticipantMapper } from '../mapper/quiz-participant.mapper';

export class QuizParticipantRepository implements IQuizParticipantRepository {
  public constructor(
    @Inject(LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _libQuizParticipantRepo: ILibQuizParticipantRepository,

    private readonly _quizParticipantMapper: QuizParticipantMapper
  ) {}

  public async create(quizParticipantEntity: QuizParticipantEntity): Promise<void> {
    const quizParticipant = this._quizParticipantMapper.toPersistence(quizParticipantEntity);
    await this._libQuizParticipantRepo.createQuizParticipant(quizParticipant);
  }

  public async update(quizParticipant: QuizParticipantEntity): Promise<void> {
    const quizParticipantId = quizParticipant.get('id');

    await this._libQuizParticipantRepo.updateQuizParticipant(quizParticipantId, {
      score: quizParticipant.get('score'),
      totalAnswers: quizParticipant.get('totalAnswers'),
      totalCorrectAnswers: quizParticipant.get('totalCorrectAnswers'),
      startedAt: quizParticipant.get('startedAt'),
      finishedAt: quizParticipant.get('finishedAt'),
      updatedBy: quizParticipant.get('updatedBy'),
      updatedAt: quizParticipant.get('updatedAt'),
    });

    if (quizParticipant.get('answers') !== undefined) {
      const currentAnswers = await this._libQuizParticipantRepo.findAllQuizParticipantAnswers(
        quizParticipantId
      );
      const newAnswerIds = quizParticipant.get('answers').map((answer) => answer.id);
      const currentAnswerIds = currentAnswers.map((answer) => answer.get('id'));
      for (const currentAnswer of currentAnswers) {
        const findAnswer = quizParticipant
          .get('answers')
          .find((newAnswer) => newAnswer.id === currentAnswer.get('id'));
        if (findAnswer && findAnswer.isCorrect !== currentAnswer.get('isCorrect')) {
          await this._libQuizParticipantRepo.updateQuizParticipantAnswer(findAnswer.id, {
            isCorrect: findAnswer.isCorrect,
          });
        }
      }

      await this._libQuizParticipantRepo.deleteQuizParticipantAnswer({
        quizParticipantId,
        id: difference(currentAnswerIds, newAnswerIds),
      });

      await this._libQuizParticipantRepo.bulkCreateQuizParticipantAnswers(
        quizParticipant
          .get('answers')
          .filter((answer) => !currentAnswerIds.includes(answer.id))
          .map((answer) => ({
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

  public async updateIsHighest(quizParticipantId: string, isHighest: boolean): Promise<void> {
    await this._libQuizParticipantRepo.updateQuizParticipant(quizParticipantId, { isHighest });
  }

  public async findQuizParticipantById(
    quizParticipantId: string
  ): Promise<QuizParticipantEntity | null> {
    const quizParticipant = await this._libQuizParticipantRepo.findQuizParticipant({
      condition: { ids: [quizParticipantId] },
      include: { shouldInCludeAnswers: true },
    });

    return this._quizParticipantMapper.toDomain(quizParticipant);
  }

  public async getQuizParticipantById(quizParticipantId: string): Promise<QuizParticipantEntity> {
    const quizParticipantEntity = await this.findQuizParticipantById(quizParticipantId);

    if (!quizParticipantEntity) {
      throw new QuizParticipantNotFoundException();
    }

    return quizParticipantEntity;
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

  public async findQuizParticipantHighestScoreByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity> {
    const quizParticipant = await this._libQuizParticipantRepo.findQuizParticipant({
      condition: {
        contentIds: [contentId],
        createdBy: userId,
        isHighest: true,
      },
    });

    return this._quizParticipantMapper.toDomain(quizParticipant);
  }

  public async getQuizParticipantHighestScoreGroupByUserId(
    contentId: string
  ): Promise<{ createdBy: string; score: number }[]> {
    const rows = await this._libQuizParticipantRepo.findAllQuizParticipants({
      condition: { contentIds: [contentId], isFinished: true },
      attributes: {
        include: ['createdBy', [Sequelize.fn('max', Sequelize.col('score')), 'score']],
      },
      group: ['created_by'],
    });

    return rows.map((row) => row.toJSON());
  }

  public async getPaginationQuizParticipantHighestScoreGroupByUserId(
    contentId: string,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<QuizParticipantEntity>> {
    const { limit = PAGING_DEFAULT_LIMIT, before, after, order = ORDER.DESC } = paginationProps;

    const { rows, meta } = await this._libQuizParticipantRepo.getQuizParticipantsPagination({
      condition: { contentIds: [contentId], isHighest: true, isFinished: true },
      limit,
      before,
      after,
      order,
    });

    return {
      rows: rows.map((row) => this._quizParticipantMapper.toDomain(row)),
      meta,
    };
  }

  public async getMapQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._libQuizParticipantRepo.findAllQuizParticipants({
      condition: {
        contentIds,
        createdBy: userId,
        isHighest: true,
        isFinished: true,
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      if (!contentIdsMapHighestScore.has(contentId)) {
        contentIdsMapHighestScore.set(contentId, this._quizParticipantMapper.toDomain(row));
      }
    });
    return contentIdsMapHighestScore;
  }

  public async getMapQuizParticipantsDoingGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._libQuizParticipantRepo.findAllQuizParticipants({
      condition: {
        contentIds,
        createdBy: userId,
        isFinished: false,
      },
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      contentIdsMapHighestScore.set(contentId, this._quizParticipantMapper.toDomain(row));
    });
    return contentIdsMapHighestScore;
  }
}
