import { TestBed } from '@automock/jest';
import { QuizQuestionAttributes, QuizQuestionModel } from '@libs/database/postgres/model';

import { QuizQuestionEntity } from '../../../domain/model/quiz';
import { QuizQuestionMapper } from '../../../driven-adapter/mapper/quiz-question.mapper';
import { createMockQuizQuestionEntity, createMockQuizQuestionRecord } from '../../mock';

describe('QuizQuestionMapper', () => {
  let _quizParticipantMapper: QuizQuestionMapper;

  let mockQuizQuestionRecord: QuizQuestionAttributes;
  let mockQuizQuestionEntity: QuizQuestionEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(QuizQuestionMapper).compile();

    _quizParticipantMapper = unit;

    mockQuizQuestionRecord = createMockQuizQuestionRecord();
    mockQuizQuestionEntity = createMockQuizQuestionEntity(mockQuizQuestionRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map quiz question model to entity success', async () => {
      const quizParticipantEntity = _quizParticipantMapper.toDomain(
        mockQuizQuestionRecord as QuizQuestionModel
      );

      expect(quizParticipantEntity).toEqual(mockQuizQuestionEntity);
    });

    it('Should return null if quiz question model is null', async () => {
      const reactionEntity = _quizParticipantMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map quiz question entity to record success', async () => {
      const quizParticipantRecord = _quizParticipantMapper.toPersistence(mockQuizQuestionEntity);

      expect(quizParticipantRecord).toEqual(mockQuizQuestionRecord);
    });
  });
});
