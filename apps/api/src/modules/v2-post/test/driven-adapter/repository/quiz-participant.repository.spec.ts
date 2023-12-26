/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { ORDER } from '@beincom/constants';
import { QuizParticipantAttributes, QuizParticipantModel } from '@libs/database/postgres/model';
import {
  LibQuizParticipantAnswerRepository,
  LibQuizParticipantRepository,
} from '@libs/database/postgres/repository';
import { Op } from 'sequelize';
import { v4 } from 'uuid';

import { QuizParticipantNotFoundException } from '../../../domain/exception';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuizParticipantMapper } from '../../../driven-adapter/mapper/quiz-participant.mapper';
import { QuizParticipantRepository } from '../../../driven-adapter/repository';
import {
  createMockQuizParticipantEntity,
  createMockQuizParticipationRecord,
} from '../../mock/quiz.mock';

jest.useFakeTimers();

describe('QuizParticipantRepository', () => {
  let _quizParticipantRepo: QuizParticipantRepository;
  let _libQuizParticipantRepo: jest.Mocked<LibQuizParticipantRepository>;
  let _libQuizParticipantAnswerRepo: jest.Mocked<LibQuizParticipantAnswerRepository>;
  let _quizParticipantMapper: jest.Mocked<QuizParticipantMapper>;

  let mockQuizParticipantRecord: QuizParticipantAttributes;
  let mockQuizParticipantEntity: QuizParticipantEntity;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(QuizParticipantRepository).compile();

    _quizParticipantRepo = unit;
    _libQuizParticipantRepo = unitRef.get(LibQuizParticipantRepository);
    _libQuizParticipantAnswerRepo = unitRef.get(LibQuizParticipantAnswerRepository);
    _quizParticipantMapper = unitRef.get(QuizParticipantMapper);

    mockQuizParticipantRecord = createMockQuizParticipationRecord();
    mockQuizParticipantEntity = createMockQuizParticipantEntity(mockQuizParticipantRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create quiz participant successfully', async () => {
      _quizParticipantMapper.toPersistence.mockReturnValue(mockQuizParticipantRecord);

      await _quizParticipantRepo.create(mockQuizParticipantEntity);

      expect(_quizParticipantMapper.toPersistence).toBeCalledWith(mockQuizParticipantEntity);
      expect(_libQuizParticipantRepo.create).toBeCalledWith(mockQuizParticipantRecord);
    });
  });

  describe('update', () => {
    it('Should update quiz successfully', async () => {
      _libQuizParticipantAnswerRepo.findMany.mockResolvedValue([]);

      await _quizParticipantRepo.update(mockQuizParticipantEntity);

      expect(_libQuizParticipantRepo.update).toBeCalledWith(
        {
          score: mockQuizParticipantRecord.score,
          totalAnswers: mockQuizParticipantRecord.totalAnswers,
          totalCorrectAnswers: mockQuizParticipantRecord.totalCorrectAnswers,
          startedAt: mockQuizParticipantRecord.startedAt,
          finishedAt: mockQuizParticipantRecord.finishedAt,
          updatedBy: mockQuizParticipantRecord.updatedBy,
          updatedAt: mockQuizParticipantRecord.updatedAt,
        },
        { where: { id: mockQuizParticipantRecord.id } }
      );
    });
  });

  describe('updateIsHighest', () => {
    it('Should update isHighest successfully', async () => {
      const mockQuizParticipantId = v4();
      await _quizParticipantRepo.updateIsHighest(mockQuizParticipantId, true);
      expect(_libQuizParticipantRepo.update).toBeCalledWith(
        { isHighest: true },
        { where: { id: mockQuizParticipantId } }
      );
    });
  });

  describe('findQuizParticipantById', () => {
    it('Should find quiz  participant successfully', async () => {
      const mockQuizParticipantId = mockQuizParticipantRecord.id;

      _libQuizParticipantRepo.first.mockResolvedValue(
        mockQuizParticipantRecord as QuizParticipantModel
      );
      _quizParticipantMapper.toDomain.mockReturnValue(mockQuizParticipantEntity);

      const quizParticipant = await _quizParticipantRepo.findQuizParticipantById(
        mockQuizParticipantId
      );

      expect(_libQuizParticipantRepo.first).toBeCalledWith({
        where: { id: mockQuizParticipantId },
        include: [
          {
            model: _libQuizParticipantAnswerRepo.getModel(),
            as: 'answers',
            required: false,
          },
        ],
      });
      expect(_quizParticipantMapper.toDomain).toBeCalledWith(mockQuizParticipantRecord);
      expect(quizParticipant).toEqual(mockQuizParticipantEntity);
    });

    it('should return null if quiz participant not found', async () => {
      const mockQuizParticipantId = mockQuizParticipantRecord.id;

      _libQuizParticipantRepo.first.mockResolvedValue(null);
      _quizParticipantMapper.toDomain.mockReturnValue(null);

      const quizParticipant = await _quizParticipantRepo.findQuizParticipantById(
        mockQuizParticipantId
      );

      expect(_libQuizParticipantRepo.first).toBeCalledWith({
        where: { id: mockQuizParticipantId },
        include: [
          {
            model: _libQuizParticipantAnswerRepo.getModel(),
            as: 'answers',
            required: false,
          },
        ],
      });
      expect(_quizParticipantMapper.toDomain).toBeCalledWith(null);
      expect(quizParticipant).toBeNull();
    });
  });

  describe('getQuizParticipantById', () => {
    it('Should get quiz participant successfully', async () => {
      const mockQuizParticipantId = mockQuizParticipantRecord.id;

      _quizParticipantRepo.findQuizParticipantById = jest
        .fn()
        .mockResolvedValue(mockQuizParticipantEntity);

      const quizParticipant = await _quizParticipantRepo.getQuizParticipantById(
        mockQuizParticipantId
      );

      expect(_quizParticipantRepo.findQuizParticipantById).toBeCalledWith(mockQuizParticipantId);
      expect(quizParticipant).toEqual(mockQuizParticipantEntity);
    });

    it('Should throw error if quiz participant is not found', async () => {
      const mockQuizParticipantId = mockQuizParticipantRecord.id;

      _quizParticipantRepo.findQuizParticipantById = jest.fn().mockResolvedValue(null);

      try {
        await _quizParticipantRepo.getQuizParticipantById(mockQuizParticipantId);
      } catch (error) {
        expect(_quizParticipantRepo.findQuizParticipantById).toBeCalledWith(mockQuizParticipantId);
        expect(error).toBeInstanceOf(QuizParticipantNotFoundException);
      }
    });
  });

  describe('findAllByContentId', () => {
    it('Should find all quiz participants successfully', async () => {
      const mockContentId = v4();
      const mockUserId = v4();

      const mockQuizParticipantRecords = [
        createMockQuizParticipationRecord(),
        createMockQuizParticipationRecord(),
      ];
      const mockQuizParticipantEntities = mockQuizParticipantRecords.map(
        createMockQuizParticipantEntity
      );

      _libQuizParticipantRepo.findMany.mockResolvedValue(
        mockQuizParticipantRecords as QuizParticipantModel[]
      );
      _quizParticipantMapper.toDomain.mockReturnValueOnce(mockQuizParticipantEntities[0]);
      _quizParticipantMapper.toDomain.mockReturnValueOnce(mockQuizParticipantEntities[1]);

      const quizParticipants = await _quizParticipantRepo.findAllByContentId(
        mockContentId,
        mockUserId
      );

      expect(_libQuizParticipantRepo.findMany).toBeCalledWith({
        where: { postId: mockContentId, createdBy: mockUserId },
        include: [
          {
            model: _libQuizParticipantAnswerRepo.getModel(),
            as: 'answers',
            required: false,
          },
        ],
      });
      expect(_quizParticipantMapper.toDomain).toBeCalledTimes(2);
      expect(quizParticipants).toEqual(mockQuizParticipantEntities);
    });
  });

  describe('findQuizParticipantHighestScoreByContentIdAndUserId', () => {
    it('Should find highest score successfully', async () => {
      const mockContentId = v4();
      const mockUserId = v4();

      _libQuizParticipantRepo.first.mockResolvedValue(
        mockQuizParticipantRecord as QuizParticipantModel
      );
      _quizParticipantMapper.toDomain.mockReturnValue(mockQuizParticipantEntity);

      const quizParticipant =
        await _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId(
          mockContentId,
          mockUserId
        );

      expect(_libQuizParticipantRepo.first).toBeCalledWith({
        where: { postId: mockContentId, createdBy: mockUserId, isHighest: true },
      });
      expect(_quizParticipantMapper.toDomain).toBeCalledWith(mockQuizParticipantRecord);
      expect(quizParticipant).toEqual(mockQuizParticipantEntity);
    });
  });

  describe('findQuizParticipantDoingByContentIdAndUserId', () => {
    it('Should find doing quiz successfully', async () => {
      const mockContentId = v4();
      const mockUserId = v4();

      _libQuizParticipantRepo.first.mockResolvedValue(
        mockQuizParticipantRecord as QuizParticipantModel
      );
      _quizParticipantMapper.toDomain.mockReturnValue(mockQuizParticipantEntity);

      const quizParticipant =
        await _quizParticipantRepo.findQuizParticipantDoingByContentIdAndUserId(
          mockContentId,
          mockUserId
        );

      expect(_libQuizParticipantRepo.first).toBeCalledWith({
        where: { postId: mockContentId, createdBy: mockUserId, finishedAt: null },
      });
      expect(_quizParticipantMapper.toDomain).toBeCalledWith(mockQuizParticipantRecord);
      expect(quizParticipant).toEqual(mockQuizParticipantEntity);
    });
  });

  describe('getQuizParticipantHighestScoreGroupByUserId', () => {
    it('Should get highest score successfully', async () => {
      const mockContentId = v4();
      const mockUserId = v4();
      const mockQuizParticipantRecords = [
        createMockQuizParticipationRecord({
          postId: mockContentId,
          isHighest: true,
          createdBy: mockUserId,
          score: 10,
        }),
      ];

      _libQuizParticipantRepo.findMany.mockResolvedValue(
        mockQuizParticipantRecords.map(
          (record) =>
            ({ toJSON: () => ({ createdBy: record.createdBy, score: record.score }) } as any)
        )
      );

      const quizParticipant =
        await _quizParticipantRepo.getQuizParticipantHighestScoreGroupByUserId(mockContentId);

      expect(_libQuizParticipantRepo.findMany).toBeCalledWith({
        where: { postId: mockContentId, finishedAt: { [Op.ne]: null } },
        select: ['createdBy'],
        selectRaw: [['MAX(score)', 'score']],
        group: ['created_by'],
      });
      expect(quizParticipant).toEqual([{ createdBy: mockUserId, score: 10 }]);
    });
  });

  describe('getPaginationQuizParticipantHighestScoreGroupByUserId', () => {
    it('should return a CursorPaginationResult object', async () => {
      const mockContentId = v4();
      const mockPaginationProps = { limit: 10 };

      _libQuizParticipantRepo.cursorPaginate.mockResolvedValue({
        rows: [mockQuizParticipantRecord] as QuizParticipantModel[],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
      _quizParticipantMapper.toDomain.mockReturnValue(mockQuizParticipantEntity);

      const result =
        await _quizParticipantRepo.getPaginationQuizParticipantHighestScoreGroupByUserId(
          mockContentId,
          mockPaginationProps
        );

      expect(_libQuizParticipantRepo.cursorPaginate).toBeCalledWith(
        {
          where: { postId: mockContentId, isHighest: true, finishedAt: { [Op.ne]: null } },
        },
        { limit: 10, order: ORDER.DESC, sortColumns: ['createdAt'] }
      );
      expect(_quizParticipantMapper.toDomain).toBeCalledWith(mockQuizParticipantRecord);
      expect(result).toEqual({
        rows: [mockQuizParticipantEntity],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });
});
