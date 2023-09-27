/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { ILibQuizRepository, LIB_QUIZ_REPOSITORY_TOKEN } from '@libs/database/postgres';
import {
  QuizQuestionAttributes,
  QuizQuestionModel,
} from '@libs/database/postgres/model/quiz-question.model';
import { QuizAttributes, QuizModel } from '@libs/database/postgres/model/quiz.model';
import { v4 } from 'uuid';

import { QuizEntity, QuizQuestionEntity } from '../../../domain/model/quiz';
import { GetPaginationQuizzesProps, IQuizRepository } from '../../../domain/repositoty-interface';
import { QuizQuestionMapper } from '../../../driven-adapter/mapper/quiz-question.mapper';
import { QuizMapper } from '../../../driven-adapter/mapper/quiz.mapper';
import { QuizRepository } from '../../../driven-adapter/repository/quiz.repository';
import { MockClass } from '../../mock';
import {
  createMockQuizEntity,
  createMockQuizQuestionEntity,
  createMockQuizQuestionRecord,
  createMockQuizRecord,
} from '../../mock/quiz.mock';

jest.useFakeTimers();

describe('QuizRepository', () => {
  let _quizRepo: IQuizRepository;
  let _libQuizRepo: MockClass<ILibQuizRepository>;
  let _quizMapper: jest.Mocked<QuizMapper>;
  let _quizQuestionMapper: jest.Mocked<QuizQuestionMapper>;

  let mockQuizRecord: QuizAttributes;
  let mockQuestionRecord: QuizQuestionAttributes;
  let mockQuizEntity: QuizEntity;
  let mockQuestionEntity: QuizQuestionEntity;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(QuizRepository).compile();

    _quizRepo = unit;
    _libQuizRepo = unitRef.get(LIB_QUIZ_REPOSITORY_TOKEN);
    _quizMapper = unitRef.get(QuizMapper);
    _quizQuestionMapper = unitRef.get(QuizQuestionMapper);

    mockQuizRecord = createMockQuizRecord();
    mockQuestionRecord = createMockQuizQuestionRecord();
    mockQuizEntity = createMockQuizEntity(mockQuizRecord);
    mockQuestionEntity = createMockQuizQuestionEntity(mockQuestionRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('Should create quiz successfully', async () => {
      _quizMapper.toPersistence.mockReturnValue(mockQuizRecord);

      await _quizRepo.createQuiz(mockQuizEntity);

      expect(_quizMapper.toPersistence).toBeCalledWith(mockQuizEntity);
      expect(_libQuizRepo.createQuiz).toBeCalledWith(mockQuizRecord);
    });
  });

  describe('updateQuiz', () => {
    it('Should update quiz successfully', async () => {
      _quizMapper.toPersistence.mockReturnValue(mockQuizRecord);

      await _quizRepo.updateQuiz(mockQuizEntity);

      expect(_quizMapper.toPersistence).toBeCalledWith(mockQuizEntity);
      expect(_libQuizRepo.updateQuiz).toBeCalledWith(mockQuizRecord.id, mockQuizRecord);
    });
  });

  describe('deleteQuiz', () => {
    it('Should delete quiz successfully', async () => {
      const mockQuizId = v4();
      await _quizRepo.deleteQuiz(mockQuizId);
      expect(_libQuizRepo.deleteQuiz).toBeCalledWith({ id: mockQuizId });
    });
  });

  describe('findQuizById', () => {
    it('Should find quiz successfully', async () => {
      const mockQuizId = mockQuizRecord.id;

      _libQuizRepo.findQuiz.mockResolvedValue(mockQuizRecord as QuizModel);
      _quizMapper.toDomain.mockReturnValue(mockQuizEntity);

      const quiz = await _quizRepo.findQuizById(mockQuizId);

      expect(_libQuizRepo.findQuiz).toBeCalledWith({ condition: { ids: [mockQuizId] } });
      expect(_quizMapper.toDomain).toBeCalledWith(mockQuizRecord);
      expect(quiz).toEqual(mockQuizEntity);
    });

    it('should return null if quiz not found', async () => {
      const mockQuizId = mockQuizRecord.id;

      _libQuizRepo.findQuiz.mockResolvedValue(null);
      _quizMapper.toDomain.mockReturnValue(null);

      const quiz = await _quizRepo.findQuizById(mockQuizId);

      expect(_libQuizRepo.findQuiz).toBeCalledWith({ condition: { ids: [mockQuizId] } });
      expect(_quizMapper.toDomain).toBeCalledWith(null);
      expect(quiz).toBeNull();
    });
  });

  describe('findQuizByIdWithQuestions', () => {
    it('Should find quiz with questions successfully', async () => {
      const mockQuizId = mockQuizRecord.id;

      _libQuizRepo.findQuiz.mockResolvedValue(mockQuizRecord as QuizModel);
      _quizMapper.toDomain.mockReturnValue(mockQuizEntity);

      const quiz = await _quizRepo.findQuizByIdWithQuestions(mockQuizId);

      expect(_libQuizRepo.findQuiz).toBeCalledWith({
        condition: { ids: [mockQuizId] },
        include: { shouldIncludeQuestions: true },
      });
      expect(_quizMapper.toDomain).toBeCalledWith(mockQuizRecord);
      expect(quiz).toEqual(mockQuizEntity);
      expect(quiz.get('questions')).not.toBeNull();
    });
  });

  describe('findAllQuizzes', () => {
    it('Should find all quizzes successfully', async () => {
      const mockQuizRecords = [createMockQuizRecord(), createMockQuizRecord()];
      const mockQuizEntities = mockQuizRecords.map((record) => createMockQuizEntity(record));

      _libQuizRepo.findAllQuizzes.mockResolvedValue(mockQuizRecords as QuizModel[]);
      _quizMapper.toDomain.mockReturnValueOnce(mockQuizEntities[0]);
      _quizMapper.toDomain.mockReturnValueOnce(mockQuizEntities[1]);

      const quizzes = await _quizRepo.findAllQuizzes({ where: { status: QUIZ_STATUS.PUBLISHED } });

      expect(_libQuizRepo.findAllQuizzes).toBeCalledWith({
        condition: { status: QUIZ_STATUS.PUBLISHED },
      });
      expect(_quizMapper.toDomain).toBeCalledTimes(2);
      expect(quizzes).toEqual(mockQuizEntities);
    });
  });

  describe('getPagination', () => {
    it('should return a CursorPaginationResult object', async () => {
      const getPaginationQuizzesProps: GetPaginationQuizzesProps = {
        where: {
          status: mockQuizRecord.status,
          createdBy: mockQuizRecord.createdBy,
          contentType: CONTENT_TYPE.POST,
        },
        attributes: ['id', 'createdAt'],
        limit: 10,
        order: ORDER.DESC,
      };

      _libQuizRepo.getQuizzesPagination.mockResolvedValue({
        rows: [mockQuizRecord] as QuizModel[],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
      _quizMapper.toDomain.mockReturnValue(mockQuizEntity);

      const result = await _quizRepo.getPagination(getPaginationQuizzesProps);

      expect(_libQuizRepo.getQuizzesPagination).toBeCalledWith({
        condition: { status: mockQuizRecord.status, createdBy: mockQuizRecord.createdBy },
        include: {
          shouldIncludeContent: {
            contentType: CONTENT_TYPE.POST,
          },
        },
        limit: 10,
        order: ORDER.DESC,
      });
      expect(_quizMapper.toDomain).toBeCalledWith(mockQuizRecord);
      expect(result).toEqual({
        rows: [mockQuizEntity],
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });

  describe('createQuestion', () => {
    it('Should create quiz question successfully', async () => {
      _quizQuestionMapper.toPersistence.mockReturnValue(mockQuestionRecord);

      await _quizRepo.createQuestion(mockQuestionEntity);

      expect(_quizQuestionMapper.toPersistence).toBeCalledWith(mockQuestionEntity);
      expect(_libQuizRepo.bulkCreateQuizQuestions).toBeCalledWith([mockQuestionRecord]);
    });
  });

  describe('deleteQuestion', () => {
    it('Should delete quiz question successfully', async () => {
      const mockQuestionId = v4();
      await _quizRepo.deleteQuestion(mockQuestionId);
      expect(_libQuizRepo.deleteQuizQuestion).toBeCalledWith({ id: mockQuestionId });
    });
  });

  describe('updateQuestion', () => {
    it('Should update quiz question successfully', async () => {
      await _quizRepo.updateQuestion(mockQuestionEntity);

      expect(_libQuizRepo.updateQuizQuestion).toBeCalledWith(mockQuestionRecord.id, {
        content: mockQuestionRecord.content,
      });
    });
  });

  describe('findQuestionById', () => {
    it('Should find quiz question successfully', async () => {
      const mockQuestionId = mockQuestionRecord.id;

      _libQuizRepo.findQuizQuestion.mockResolvedValue(mockQuestionRecord as QuizQuestionModel);
      _quizQuestionMapper.toDomain.mockReturnValue(mockQuestionEntity);

      const question = await _quizRepo.findQuestionById(mockQuestionId);

      expect(_libQuizRepo.findQuizQuestion).toBeCalledWith({
        condition: { ids: [mockQuestionId] },
        include: { shouldIncludeAnswers: true },
      });
      expect(_quizQuestionMapper.toDomain).toBeCalledWith(mockQuestionRecord);
      expect(question).toEqual(mockQuestionEntity);
    });

    it('should return null if quiz question not found', async () => {
      const mockQuestionId = mockQuestionRecord.id;

      _libQuizRepo.findQuizQuestion.mockResolvedValue(null);
      _quizQuestionMapper.toDomain.mockReturnValue(null);

      const question = await _quizRepo.findQuestionById(mockQuestionId);

      expect(_libQuizRepo.findQuizQuestion).toBeCalledWith({
        condition: { ids: [mockQuestionId] },
        include: { shouldIncludeAnswers: true },
      });
      expect(_quizQuestionMapper.toDomain).toBeCalledWith(null);
      expect(question).toBeNull();
    });
  });

  describe('createAnswers', () => {
    it('Should create quiz answer successfully', async () => {
      const mockAnswers = mockQuestionRecord.answers.map((answer, index) => ({
        ...answer,
        updatedAt: new Date(
          answer.createdAt.setMilliseconds(answer.createdAt.getMilliseconds() + index)
        ),
      }));

      await _quizRepo.createAnswers(mockQuestionEntity);

      expect(_libQuizRepo.bulkCreateQuizAnswers).toBeCalledWith(mockAnswers);
    });
  });

  describe('deleteAnswersByQuestionId', () => {
    it('Should delete quiz answer successfully', async () => {
      const mockQuestionId = v4();
      await _quizRepo.deleteAnswersByQuestionId(mockQuestionId);
      expect(_libQuizRepo.deleteQuizAnswer).toBeCalledWith({ questionId: mockQuestionId });
    });
  });
});
