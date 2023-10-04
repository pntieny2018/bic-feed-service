import { ORDER } from '@beincom/constants';
import { difference } from 'lodash';

import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { CursorPaginationProps, CursorPaginationResult } from '../../../../common/types';
import { QuizParticipantNotFoundException } from '../../domain/exception';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { IQuizParticipantRepository } from '../../domain/repositoty-interface';
import { QuizParticipantMapper } from '../mapper/quiz-participant.mapper';
import { LibQuizParticipantRepository } from '@libs/database/postgres/repository';
import { LibQuizParticipantAnswerRepository } from '@libs/database/postgres/repository/quiz-participant-answer.repository';

export class QuizParticipantRepository implements IQuizParticipantRepository {
  public constructor(
    private readonly _libQuizParticipantRepo: LibQuizParticipantRepository,
    private readonly _libQuizParticipantAnswerRepo: LibQuizParticipantAnswerRepository,
    private readonly _quizParticipantMapper: QuizParticipantMapper
  ) {}

  public async create(quizParticipantEntity: QuizParticipantEntity): Promise<void> {
    const quizParticipant = this._quizParticipantMapper.toPersistence(quizParticipantEntity);
    await this._libQuizParticipantRepo.create(quizParticipant);
  }

  public async update(quizParticipant: QuizParticipantEntity): Promise<void> {
    const quizParticipantId = quizParticipant.get('id');

    await this._libQuizParticipantRepo.update(
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
        where: { id: quizParticipantId },
      }
    );

    if (quizParticipant.get('answers') !== undefined) {
      const currentAnswers = await this._libQuizParticipantAnswerRepo.findMany({
        where: { quizParticipantId },
      });
      const newAnswerIds = quizParticipant.get('answers').map((answer) => answer.id);
      const currentAnswerIds = currentAnswers.map((answer) => answer.get('id'));
      for (const currentAnswer of currentAnswers) {
        const findAnswer = quizParticipant
          .get('answers')
          .find((newAnswer) => newAnswer.id === currentAnswer.get('id'));
        if (findAnswer && findAnswer.isCorrect !== currentAnswer.get('isCorrect')) {
          await this._libQuizParticipantAnswerRepo.update(
            {
              isCorrect: findAnswer.isCorrect,
            },
            {
              where: { id: findAnswer.id },
            }
          );
        }
      }

      await this._libQuizParticipantAnswerRepo.delete({
        where: {
          quizParticipantId,
          id: difference(currentAnswerIds, newAnswerIds),
        },
      });

      await this._libQuizParticipantAnswerRepo.bulkCreate(
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
    await this._libQuizParticipantRepo.update(
      { isHighest },
      {
        where: { id: quizParticipantId },
      }
    );
  }

  public async findQuizParticipantById(
    quizParticipantId: string
  ): Promise<QuizParticipantEntity | null> {
    const quizParticipant = await this._libQuizParticipantRepo.first({
      where: { id: quizParticipantId },
      include: [
        {
          model: this._libQuizParticipantAnswerRepo.getModel(),
          as: 'answers',
          required: false,
        },
      ],
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
    const quizParticipants = await this._libQuizParticipantRepo.findMany({
      where: { postId: contentId, createdBy: userId },
      include: [
        {
          model: this._libQuizParticipantAnswerRepo.getModel(),
          as: 'answers',
          required: false,
        },
      ],
    });

    return quizParticipants.map((quizParticipant) =>
      this._quizParticipantMapper.toDomain(quizParticipant)
    );
  }

  public async findQuizParticipantHighestScoreByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity> {
    const quizParticipant = await this._libQuizParticipantRepo.first({
      where: {
        postId: contentId,
        createdBy: userId,
        isHighest: true,
      },
    });

    return this._quizParticipantMapper.toDomain(quizParticipant);
  }

  public async getQuizParticipantHighestScoreGroupByUserId(
    contentId: string
  ): Promise<{ createdBy: string; score: number }[]> {
    const rows = await this._libQuizParticipantRepo.findMany({
      where: { post: contentId },
      whereRaw: this._libQuizParticipantRepo.getConditionIsFinished(),
      select: ['createdBy'],
      selectRaw: [['MAX(score)', 'score']],
      group: ['created_by'],
    });

    return rows.map((row) => row.toJSON());
  }

  public async getPaginationQuizParticipantHighestScoreGroupByUserId(
    contentId: string,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<QuizParticipantEntity>> {
    const { limit = PAGING_DEFAULT_LIMIT, before, after, order = ORDER.DESC } = paginationProps;

    const { rows, meta } = await this._libQuizParticipantRepo.cursorPaginate(
      {
        where: { postId: contentId, isHighest: true },
        whereRaw: this._libQuizParticipantRepo.getConditionIsFinished(),
      },
      {
        limit,
        before,
        after,
        order,
        column: 'createdAt',
      }
    );

    return {
      rows: rows.map((row) => this._quizParticipantMapper.toDomain(row)),
      meta,
    };
  }

  public async getMapQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>> {
    const rows = await this._libQuizParticipantRepo.findMany({
      where: {
        postId: contentIds,
        createdBy: userId,
        isHighest: true,
      },
      whereRaw: this._libQuizParticipantRepo.getConditionIsFinished(),
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
    const rows = await this._libQuizParticipantRepo.findMany({
      where: {
        postId: contentIds,
        createdBy: userId,
      },
      whereRaw: this._libQuizParticipantRepo.getConditionIsNotFinished(),
    });
    const contentIdsMapHighestScore = new Map<string, QuizParticipantEntity>();
    rows.forEach((row) => {
      const contentId = row.postId;
      contentIdsMapHighestScore.set(contentId, this._quizParticipantMapper.toDomain(row));
    });
    return contentIdsMapHighestScore;
  }
}
