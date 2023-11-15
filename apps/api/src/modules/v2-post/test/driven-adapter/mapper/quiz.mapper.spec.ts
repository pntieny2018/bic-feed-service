import { TestBed } from '@automock/jest';
import { QuizAttributes, QuizModel } from '@libs/database/postgres/model';

import { QuizEntity } from '../../../domain/model/quiz';
import { QuizMapper } from '../../../driven-adapter/mapper/quiz.mapper';
import { createMockQuizEntity, createMockQuizRecord } from '../../mock';

describe('QuizMapper', () => {
  let _quizMapper: QuizMapper;

  let mockQuizRecord: QuizAttributes;
  let mockQuizEntity: QuizEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(QuizMapper).compile();

    _quizMapper = unit;

    mockQuizRecord = createMockQuizRecord();
    mockQuizEntity = createMockQuizEntity(mockQuizRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map quiz question model to entity success', async () => {
      const quizParticipantEntity = _quizMapper.toDomain(mockQuizRecord as QuizModel);

      expect(quizParticipantEntity).toEqual(mockQuizEntity);
    });

    it('Should return null if quiz question model is null', async () => {
      const reactionEntity = _quizMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map quiz question entity to record success', async () => {
      const quizParticipantRecord = _quizMapper.toPersistence(mockQuizEntity);

      expect(quizParticipantRecord).toEqual(mockQuizRecord);
    });
  });
});
