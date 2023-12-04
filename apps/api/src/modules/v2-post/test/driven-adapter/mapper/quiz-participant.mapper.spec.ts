import { TestBed } from '@automock/jest';
import { QuizParticipantAttributes, QuizParticipantModel } from '@libs/database/postgres/model';

import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuizParticipantMapper } from '../../../driven-adapter/mapper/quiz-participant.mapper';
import { createMockQuizParticipantEntity, createMockQuizParticipationRecord } from '../../mock';

jest.useFakeTimers();

describe('QuizParticipantMapper', () => {
  let _quizParticipantMapper: QuizParticipantMapper;

  let mockQuizParticipantRecord: QuizParticipantAttributes;
  let mockQuizParticipantEntity: QuizParticipantEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(QuizParticipantMapper).compile();

    _quizParticipantMapper = unit;

    mockQuizParticipantRecord = createMockQuizParticipationRecord();
    mockQuizParticipantEntity = createMockQuizParticipantEntity(mockQuizParticipantRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map quiz participant model to entity success', async () => {
      const quizParticipantEntity = _quizParticipantMapper.toDomain(
        mockQuizParticipantRecord as QuizParticipantModel
      );

      expect(quizParticipantEntity).toEqual(mockQuizParticipantEntity);
    });

    it('Should return null if quiz participant model is null', async () => {
      const reactionEntity = _quizParticipantMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map quiz participant entity to record success', async () => {
      const quizParticipantRecord = _quizParticipantMapper.toPersistence(mockQuizParticipantEntity);

      expect(quizParticipantRecord).toEqual(mockQuizParticipantRecord);
    });
  });
});
