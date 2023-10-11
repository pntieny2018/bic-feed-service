/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@automock/jest';
import { CONTENT_TYPE, ORDER, QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { v4 } from 'uuid';

import { DatabaseException, DomainModelException } from '../../../../../common/exceptions';
import { RULES } from '../../../constant';
import { GetQuizzesProps } from '../../../domain/domain-service/interface';
import { QuizDomainService } from '../../../domain/domain-service/quiz.domain-service';
import {
  QuizCreatedEvent,
  QuizParticipantFinishedEvent,
  QuizParticipantStartedEvent,
  QuizRegenerateEvent,
} from '../../../domain/event';
import {
  ContentAccessDeniedException,
  ContentHasQuizException,
  QuizNotFoundException,
  QuizOverTimeException,
  QuizParticipantNotFinishedException,
  QuizQuestionBelongsToQuizException,
  QuizQuestionLimitExceededException,
  QuizQuestionNotFoundException,
} from '../../../domain/exception';
import { EVENT_ADAPTER, IEventAdapter } from '../../../domain/infra-adapter-interface';
import { QuizEntity, QuizQuestionEntity } from '../../../domain/model/quiz';
import {
  IQuizParticipantRepository,
  IQuizRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  MockClass,
  createMockQuizAnswerRecord,
  createMockQuizEntity,
  createMockQuizParticipantEntity,
  createMockQuizQuestionEntity,
  createMockQuizQuestionRecord,
  createMockUserDto,
} from '../../mock';

jest.useFakeTimers();

describe('QuizRepository', () => {
  let _quizDomain: QuizDomainService;
  let _quizRepo: MockClass<IQuizRepository>;
  let _quizParticipantRepo: MockClass<IQuizParticipantRepository>;
  let _quizValidator: MockClass<IQuizValidator>;
  let _eventAdapter: MockClass<IEventAdapter>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(QuizDomainService).compile();

    _quizDomain = unit;
    _quizRepo = unitRef.get(QUIZ_REPOSITORY_TOKEN);
    _quizParticipantRepo = unitRef.get(QUIZ_PARTICIPANT_REPOSITORY_TOKEN);
    _quizValidator = unitRef.get(QUIZ_VALIDATOR_TOKEN);
    _eventAdapter = unitRef.get(EVENT_ADAPTER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockContentId = v4();
    const mockUser = createMockUserDto();
    const mockCreateQuizProps = {
      contentId: mockContentId,
      numberOfQuestions: 10,
      numberOfAnswers: 4,
      authUser: mockUser,
      title: 'test',
      description: 'test',
      numberOfQuestionsDisplay: 5,
      isRandom: true,
    };

    it('Should create quiz successfully', async () => {
      const mockQuizEntity = QuizEntity.create(mockCreateQuizProps, mockUser.id);

      _quizRepo.findAllQuizzes.mockResolvedValue([]);

      const quizEntity = await _quizDomain.create(mockCreateQuizProps);

      const mockQuiz = mockQuizEntity.getSnapshot();
      const quiz = quizEntity.getSnapshot();

      const createQuizCalledArg = _quizRepo.createQuiz.mock.calls[0][0];
      const createQuizCalledArgSnapshot = createQuizCalledArg.getSnapshot();

      delete mockQuiz.id;
      delete quiz.id;
      delete createQuizCalledArgSnapshot.id;

      expect(quiz).toEqual(mockQuiz);
      expect(createQuizCalledArgSnapshot).toEqual(mockQuiz);

      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockCreateQuizProps.contentId,
        mockCreateQuizProps.authUser
      );
      expect(_quizRepo.findAllQuizzes).toBeCalledWith({ where: { contentId: mockContentId } });
      expect(_eventAdapter.publish).toBeCalledWith(
        new QuizCreatedEvent({ quizId: quizEntity.get('id') })
      );
    });

    it('Should throw error when actor access denied ', async () => {
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.create(mockCreateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockCreateQuizProps.contentId,
          mockCreateQuizProps.authUser
        );
        expect(_quizRepo.findAllQuizzes).not.toBeCalled();
        expect(_quizRepo.createQuiz).not.toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });

    it('Should throw error when content already has quiz ', async () => {
      _quizRepo.findAllQuizzes.mockResolvedValue([createMockQuizEntity()]);

      try {
        await _quizDomain.create(mockCreateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentHasQuizException);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockCreateQuizProps.contentId,
          mockCreateQuizProps.authUser
        );
        expect(_quizRepo.findAllQuizzes).toBeCalledWith({ where: { contentId: mockContentId } });
        expect(_quizRepo.createQuiz).not.toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });

    it('Should throw error when create quiz to db error ', async () => {
      _quizRepo.findAllQuizzes.mockResolvedValue([]);
      _quizRepo.createQuiz.mockRejectedValue(new Error());

      try {
        await _quizDomain.create(mockCreateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockCreateQuizProps.contentId,
          mockCreateQuizProps.authUser
        );
        expect(_quizRepo.findAllQuizzes).toBeCalledWith({ where: { contentId: mockContentId } });
        expect(_quizRepo.createQuiz).toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });
  });

  describe('update', () => {
    const mockQuizId = v4();
    const mockUser = createMockUserDto();
    const mockUpdateQuizProps = {
      quizId: mockQuizId,
      numberOfQuestions: 10,
      numberOfAnswers: 4,
      title: 'test',
      description: 'test',
      numberOfQuestionsDisplay: 1,
      isRandom: true,
      status: QUIZ_STATUS.PUBLISHED,
      authUser: mockUser,
    };

    it('Should update quiz successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId, ...mockUpdateQuizProps });
      mockQuizEntity.updateAttribute(mockUpdateQuizProps);

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      const quizEntity = await _quizDomain.update(mockUpdateQuizProps);

      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUpdateQuizProps.authUser
      );
      expect(_quizRepo.updateQuiz).toBeCalledWith(mockQuizEntity);
      expect(quizEntity).toEqual(mockQuizEntity);
    });

    it('Should throw error when quiz is not found', async () => {
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(null);

      try {
        await _quizDomain.update(mockUpdateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId, ...mockUpdateQuizProps });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.update(mockUpdateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuizProps.authUser
        );
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when create quiz to db error ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId, ...mockUpdateQuizProps });
      mockQuizEntity.updateAttribute(mockUpdateQuizProps);

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizRepo.updateQuiz.mockRejectedValue(new Error());

      try {
        await _quizDomain.update(mockUpdateQuizProps);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuizProps.authUser
        );
        expect(_quizRepo.updateQuiz).toBeCalledWith(mockQuizEntity);
      }
    });
  });

  describe('updateQuestion', () => {
    const mockQuizId = v4();
    const mockQuestionId = v4();
    const mockUser = createMockUserDto();
    const mockUpdateQuestionProps = {
      questionId: mockQuestionId,
      quizId: mockQuizId,
      content: 'test',
      answers: [
        {
          id: v4(),
          content: 'answer 1',
          isCorrect: true,
        },
        {
          id: v4(),
          content: 'answer 2',
          isCorrect: false,
        },
      ],
      authUser: mockUser,
    };

    it('Should update question successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: [],
      });
      mockQuestionEntity.updateAttribute({
        content: mockUpdateQuestionProps.content,
        answers: mockUpdateQuestionProps.answers,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      const questionEntity = await _quizDomain.updateQuestion(mockUpdateQuestionProps);

      expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUpdateQuestionProps.authUser
      );
      expect(_quizRepo.updateQuestion).toBeCalledWith(mockQuestionEntity);
      expect(_quizRepo.deleteAnswersByQuestionId).toBeCalledWith(mockQuestionId);
      expect(_quizRepo.createAnswers).toBeCalledWith(mockQuestionEntity);
      expect(questionEntity).toEqual(mockQuestionEntity);
    });

    it('Should throw error when question is not found', async () => {
      _quizRepo.findQuestionById.mockResolvedValue(null);

      try {
        await _quizDomain.updateQuestion(mockUpdateQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizQuestionNotFoundException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).not.toBeCalled();
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when question is not belong to quiz', async () => {
      const mockQuestionEntity = createMockQuizQuestionEntity({ id: mockQuestionId });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);

      try {
        await _quizDomain.updateQuestion(mockUpdateQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizQuestionBelongsToQuizException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).not.toBeCalled();
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when quiz is not found', async () => {
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: mockUpdateQuestionProps.answers.map((answer) =>
          createMockQuizAnswerRecord({ ...answer, questionId: mockQuestionId })
        ),
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(null);

      try {
        await _quizDomain.updateQuestion(mockUpdateQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: mockUpdateQuestionProps.answers.map((answer) =>
          createMockQuizAnswerRecord({ ...answer, questionId: mockQuestionId })
        ),
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.updateQuestion(mockUpdateQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when answers is empty', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: [],
      });
      mockQuestionEntity.updateAttribute({
        content: mockUpdateQuestionProps.content,
        answers: mockUpdateQuestionProps.answers,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.updateQuestion({ ...mockUpdateQuestionProps, answers: [] });
      } catch (error) {
        expect(error).toBeInstanceOf(DomainModelException);
        expect(error.message).toEqual('Quiz question must have at least one answer');
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when answers is all wrong', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: [],
      });
      mockQuestionEntity.updateAttribute({
        content: mockUpdateQuestionProps.content,
        answers: mockUpdateQuestionProps.answers,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.updateQuestion({
          ...mockUpdateQuestionProps,
          answers: mockUpdateQuestionProps.answers.map((answer) => ({
            ...answer,
            isCorrect: false,
          })),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DomainModelException);
        expect(error.message).toEqual('Quiz question must have at least one correct answer');
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when answers is max', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: [],
      });
      mockQuestionEntity.updateAttribute({
        content: mockUpdateQuestionProps.content,
        answers: mockUpdateQuestionProps.answers,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.updateQuestion({
          ...mockUpdateQuestionProps,
          answers: [
            {
              id: v4(),
              content: 'answer 1',
              isCorrect: true,
            },
            {
              id: v4(),
              content: 'answer 2',
              isCorrect: false,
            },
            {
              id: v4(),
              content: 'answer 3',
              isCorrect: false,
            },
            {
              id: v4(),
              content: 'answer 4',
              isCorrect: false,
            },
            {
              id: v4(),
              content: 'answer 5',
              isCorrect: false,
            },
            {
              id: v4(),
              content: 'answer 6',
              isCorrect: false,
            },
            {
              id: v4(),
              content: 'answer 7',
              isCorrect: false,
            },
          ],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DomainModelException);
        expect(error.message).toEqual(`Quiz answers must have <= ${RULES.QUIZ_MAX_ANSWER} answers`);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when answers is all correct', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: [],
      });
      mockQuestionEntity.updateAttribute({
        content: mockUpdateQuestionProps.content,
        answers: mockUpdateQuestionProps.answers,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.updateQuestion({
          ...mockUpdateQuestionProps,
          answers: mockUpdateQuestionProps.answers.map((answer) => ({
            ...answer,
            isCorrect: true,
          })),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(DomainModelException);
        expect(error.message).toEqual('Quiz question must have only one correct answer');
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).not.toBeCalled();
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when create quiz to db error ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        ...mockUpdateQuestionProps,
        id: mockQuestionId,
        answers: mockUpdateQuestionProps.answers.map((answer) =>
          createMockQuizAnswerRecord({ ...answer, questionId: mockQuestionId })
        ),
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizRepo.updateQuestion.mockRejectedValue(new Error());

      try {
        await _quizDomain.updateQuestion(mockUpdateQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUpdateQuestionProps.authUser
        );
        expect(_quizRepo.updateQuestion).toBeCalledWith(mockQuestionEntity);
        expect(_quizRepo.deleteAnswersByQuestionId).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });
  });

  describe('addQuestion', () => {
    const mockQuizId = v4();
    const mockUser = createMockUserDto();
    const mockAddQuestionProps = {
      quizId: mockQuizId,
      content: 'test',
      answers: [
        {
          id: v4(),
          content: 'answer 1',
          isCorrect: true,
        },
        {
          id: v4(),
          content: 'answer 2',
          isCorrect: false,
        },
      ],
      authUser: mockUser,
    };

    it('Should add question successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = QuizQuestionEntity.create(mockAddQuestionProps);

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      const questionEntity = await _quizDomain.addQuestion(mockAddQuestionProps);

      const mockQuestion = mockQuestionEntity.getSnapshot();
      const question = questionEntity.getSnapshot();

      const createQuestionCalledArg = _quizRepo.createQuestion.mock.calls[0][0];
      const createQuestionCalledArgSnapshot = createQuestionCalledArg.getSnapshot();

      const createAnswerCalledArg = _quizRepo.createAnswers.mock.calls[0][0];
      const createAnswerCalledArgSnapshot = createAnswerCalledArg.getSnapshot();

      delete mockQuestion.id;
      delete question.id;
      delete createQuestionCalledArgSnapshot.id;
      delete createAnswerCalledArgSnapshot.id;

      mockQuestion.answers.map((answer) => delete answer.id);
      question.answers.map((answer) => delete answer.id);
      createQuestionCalledArgSnapshot.answers.map((answer) => delete answer.id);
      createAnswerCalledArgSnapshot.answers.map((answer) => delete answer.id);

      expect(question).toEqual(mockQuestion);
      expect(createQuestionCalledArgSnapshot).toEqual(mockQuestion);
      expect(createAnswerCalledArgSnapshot).toEqual(mockQuestion);

      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUser
      );
      expect(_quizRepo.createQuestion).toBeCalled();
      expect(_quizRepo.createAnswers).toBeCalled();
    });

    it('Should throw error when quiz is not found', async () => {
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(null);

      try {
        await _quizDomain.addQuestion(mockAddQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.createQuestion).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.addQuestion(mockAddQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.createQuestion).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when quiz has max question', async () => {
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        questions: Array(50).map(() => createMockQuizQuestionRecord({ quizId: mockQuizId })),
      });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.addQuestion(mockAddQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizQuestionLimitExceededException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.createQuestion).not.toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });

    it('Should throw error when create quiz to db error ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizRepo.createQuestion.mockRejectedValue(new Error());

      try {
        await _quizDomain.addQuestion(mockAddQuestionProps);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.createQuestion).toBeCalled();
        expect(_quizRepo.createAnswers).not.toBeCalled();
      }
    });
  });

  describe('deleteQuestion', () => {
    const mockQuizId = v4();
    const mockQuestionId = v4();
    const mockUser = createMockUserDto();

    it('Should delete question successfully', async () => {
      const mockUuid = v4();
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        questions: [
          createMockQuizQuestionRecord({ id: mockQuestionId, quizId: mockQuizId }),
          createMockQuizQuestionRecord({ id: mockUuid, quizId: mockQuizId }),
        ],
      });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        id: mockQuestionId,
        quizId: mockQuizId,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      mockQuizEntity.deleteQuestion(mockQuestionId);

      await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);

      expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUser
      );
      expect(_quizRepo.updateQuiz).toBeCalledWith(mockQuizEntity);
    });

    it('Should throw error when question is not found', async () => {
      _quizRepo.findQuestionById.mockResolvedValue(null);

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizQuestionNotFoundException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).not.toBeCalled();
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when question is not belong to quiz', async () => {
      const mockQuestionEntity = createMockQuizQuestionEntity({ id: mockQuestionId });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizQuestionBelongsToQuizException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).not.toBeCalled();
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when quiz is not found', async () => {
      const mockQuestionEntity = createMockQuizQuestionEntity({
        id: mockQuestionId,
        quizId: mockQuizId,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(null);

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        id: mockQuestionId,
        quizId: mockQuizId,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when quiz has one question', async () => {
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        questions: [createMockQuizQuestionRecord({ id: mockQuestionId, quizId: mockQuizId })],
      });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        id: mockQuestionId,
        quizId: mockQuizId,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainModelException);
        expect(error.message).toEqual('Quiz must have at least one question');
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.updateQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when create quiz to db error ', async () => {
      const mockUuid = v4();
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        questions: [
          createMockQuizQuestionRecord({ id: mockQuestionId, quizId: mockQuizId }),
          createMockQuizQuestionRecord({ id: mockUuid, quizId: mockQuizId }),
        ],
      });
      const mockQuestionEntity = createMockQuizQuestionEntity({
        id: mockQuestionId,
        quizId: mockQuizId,
      });

      _quizRepo.findQuestionById.mockResolvedValue(mockQuestionEntity);
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizRepo.updateQuiz.mockRejectedValue(new Error());

      try {
        await _quizDomain.deleteQuestion(mockQuestionId, mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuestionById).toBeCalledWith(mockQuestionId);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.updateQuiz).toBeCalled();
      }
    });
  });

  describe('getQuiz', () => {
    const mockQuizId = v4();
    const mockUser = createMockUserDto();

    it('Should get quiz successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      const quizEntity = await _quizDomain.getQuiz(mockQuizId, mockUser);

      expect(quizEntity).toEqual(quizEntity);
      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUser
      );
    });

    it('Should throw error when quiz is not found ', async () => {
      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(null);

      try {
        await _quizDomain.getQuiz(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.getQuiz(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
      }
    });
  });

  describe('delete', () => {
    const mockQuizId = v4();
    const mockUser = createMockUserDto();

    it('Should delete quiz successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizById.mockResolvedValue(mockQuizEntity);

      const quizEntity = await _quizDomain.delete(mockQuizId, mockUser);

      expect(quizEntity).toEqual(quizEntity);
      expect(_quizRepo.findQuizById).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUser
      );
      expect(_quizRepo.deleteQuiz).toBeCalledWith(mockQuizId);
    });

    it('Should throw error when quiz is not found ', async () => {
      _quizRepo.findQuizById.mockResolvedValue(null);

      try {
        await _quizDomain.delete(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuizById).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.deleteQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when actor access denied ', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizById.mockResolvedValue(mockQuizEntity);
      _quizValidator.checkCanCUDQuizInContent.mockRejectedValue(new ContentAccessDeniedException());

      try {
        await _quizDomain.delete(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizRepo.findQuizById).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.deleteQuiz).not.toBeCalled();
      }
    });

    it('Should throw error when delete quiz to db error', async () => {
      const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });

      _quizRepo.findQuizById.mockResolvedValue(mockQuizEntity);
      _quizRepo.deleteQuiz.mockRejectedValue(new Error());

      try {
        await _quizDomain.delete(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuizById).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.deleteQuiz).toBeCalledWith(mockQuizId);
      }
    });
  });

  describe('startQuiz', () => {
    const mockUser = createMockUserDto();
    const mockQuizEntity = createMockQuizEntity({ createdBy: mockUser.id, updatedBy: mockUser.id });
    const mockQuizParticipantEntity = createMockQuizParticipantEntity({
      postId: mockQuizEntity.get('contentId'),
      quizId: mockQuizEntity.get('id'),
      timeLimit: mockQuizEntity.get('timeLimit'),
      quizSnapshot: {
        title: mockQuizEntity.get('title'),
        description: mockQuizEntity.get('description'),
        questions: mockQuizEntity.get('questions').map((question) => ({
          id: question.get('id'),
          content: question.get('content'),
          createdAt: question.get('createdAt'),
          updatedAt: question.get('updatedAt'),
          answers: question.get('answers').map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          })),
        })),
      },
      createdBy: mockUser.id,
      updatedBy: mockUser.id,
    });

    it('Should start quiz successfully', async () => {
      const quizParticipantEntity = await _quizDomain.startQuiz(mockQuizEntity, mockUser);

      const mockQuizParticipant = mockQuizParticipantEntity.getSnapshot();
      const quizParticipant = quizParticipantEntity.getSnapshot();
      const createParticipantCalledArg = _quizParticipantRepo.create.mock.calls[0][0];
      const createParticipantCalledArgSnapshot = createParticipantCalledArg.getSnapshot();
      const runtimeQuizParticipantId = createParticipantCalledArgSnapshot.id;

      delete mockQuizParticipant.id;
      delete quizParticipant.id;
      delete createParticipantCalledArgSnapshot.id;

      expect(quizParticipant).toEqual(mockQuizParticipant);
      expect(createParticipantCalledArgSnapshot).toEqual(mockQuizParticipant);
      expect(_eventAdapter.publish).toBeCalledWith(
        new QuizParticipantStartedEvent({
          quizParticipantId: runtimeQuizParticipantId,
          startedAt: mockQuizParticipantEntity.get('startedAt'),
          timeLimit: mockQuizParticipantEntity.get('timeLimit'),
        })
      );
    });

    it('Should throw error when start quiz to db error', async () => {
      _quizParticipantRepo.create.mockRejectedValue(new Error());

      try {
        await _quizDomain.startQuiz(mockQuizEntity, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizParticipantRepo.create).toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });
  });

  describe('updateQuizAnswers', () => {
    const mockQuizId = v4();
    const mockQuizEntity = createMockQuizEntity({ id: mockQuizId });
    const mockQuizParticipantEntity = createMockQuizParticipantEntity({
      quizId: mockQuizId,
      quizSnapshot: {
        title: mockQuizEntity.get('title'),
        description: mockQuizEntity.get('description'),
        questions: mockQuizEntity.get('questions').map((question) => ({
          id: question.get('id'),
          content: question.get('content'),
          createdAt: question.get('createdAt'),
          updatedAt: question.get('updatedAt'),
          answers: question.get('answers').map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          })),
        })),
      },
    });
    const mockAnswers = [{ id: v4(), questionId: v4(), answerId: v4() }];

    it('Should update answer without finish successfully', async () => {
      mockQuizParticipantEntity.updateAnswers(mockAnswers);

      await _quizDomain.updateQuizAnswers(mockQuizParticipantEntity, mockAnswers, false);

      expect(_quizParticipantRepo.update).toBeCalledWith(mockQuizParticipantEntity);
      expect(_eventAdapter.publish).not.toBeCalled();
    });

    it('Should update answer with finish successfully', async () => {
      mockQuizParticipantEntity.updateAnswers(mockAnswers);

      await _quizDomain.updateQuizAnswers(mockQuizParticipantEntity, mockAnswers, true);

      expect(_quizParticipantRepo.update).toBeCalledWith(mockQuizParticipantEntity);
      expect(_eventAdapter.publish).toBeCalledWith(
        new QuizParticipantFinishedEvent({
          quizParticipantId: mockQuizParticipantEntity.get('id'),
        })
      );
    });

    it('Should throw error when quiz is overtime', async () => {
      const mockQuizParticipantEntity = createMockQuizParticipantEntity({ finishedAt: new Date() });

      try {
        await _quizDomain.updateQuizAnswers(mockQuizParticipantEntity, mockAnswers, true);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizOverTimeException);
        expect(_quizParticipantRepo.update).not.toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });
  });

  describe('getQuizzes', () => {
    const mockUser = createMockUserDto();
    const getQuizzesProps: GetQuizzesProps = {
      authUser: mockUser,
      status: QUIZ_STATUS.PUBLISHED,
      type: CONTENT_TYPE.POST,
      limit: 10,
      order: ORDER.DESC,
    };

    it('should return a CursorPaginationResult object', async () => {
      const mockQuizEntities = [
        createMockQuizEntity({ status: getQuizzesProps.status, createdBy: mockUser.id }),
      ];

      _quizRepo.getPagination.mockResolvedValue({
        rows: mockQuizEntities,
        meta: { hasNextPage: false, hasPreviousPage: false },
      });

      const result = await _quizDomain.getQuizzes(getQuizzesProps);

      expect(_quizRepo.getPagination).toBeCalledWith({
        ...getQuizzesProps,
        where: {
          createdBy: mockUser.id,
          status: getQuizzesProps.status,
          contentType: getQuizzesProps.type,
        },
        attributes: ['id', 'postId', 'createdAt'],
      });
      expect(result).toEqual({
        rows: mockQuizEntities,
        meta: { hasNextPage: false, hasPreviousPage: false },
      });
    });
  });

  describe('reGenerate', () => {
    const mockQuizId = v4();
    const mockUser = createMockUserDto();

    it('should regenerate question successfully', async () => {
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        createdBy: mockUser.id,
        genStatus: QUIZ_PROCESS_STATUS.PENDING,
      });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);

      await _quizDomain.reGenerate(mockQuizId, mockUser);

      expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
      expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
        mockQuizEntity.get('contentId'),
        mockUser
      );
      expect(_quizRepo.updateQuiz).toBeCalledWith(mockQuizEntity);
      expect(_eventAdapter.publish).toBeCalledWith(new QuizRegenerateEvent({ quizId: mockQuizId }));
    });

    it('should throw error if quiz is not found', async () => {
      try {
        await _quizDomain.reGenerate(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizNotFoundException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).not.toBeCalled();
        expect(_quizRepo.updateQuiz).not.toBeCalled();
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });

    it('should throw error if save to db fail', async () => {
      const mockQuizEntity = createMockQuizEntity({
        id: mockQuizId,
        createdBy: mockUser.id,
        genStatus: QUIZ_PROCESS_STATUS.PENDING,
      });

      _quizRepo.findQuizByIdWithQuestions.mockResolvedValue(mockQuizEntity);
      _quizRepo.updateQuiz.mockRejectedValue(new Error());

      try {
        await _quizDomain.reGenerate(mockQuizId, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseException);
        expect(_quizRepo.findQuizByIdWithQuestions).toBeCalledWith(mockQuizId);
        expect(_quizValidator.checkCanCUDQuizInContent).toBeCalledWith(
          mockQuizEntity.get('contentId'),
          mockUser
        );
        expect(_quizRepo.updateQuiz).toBeCalledWith(mockQuizEntity);
        expect(_eventAdapter.publish).not.toBeCalled();
      }
    });
  });

  describe('getQuizzes', () => {
    const mockUserId = v4();
    const mockQuizParticipantId = v4();

    it('should return a quiz participant', async () => {
      const mockQuizParticipantEntity = createMockQuizParticipantEntity({
        id: mockQuizParticipantId,
        createdBy: mockUserId,
      });

      _quizParticipantRepo.getQuizParticipantById.mockResolvedValue(mockQuizParticipantEntity);

      const quizParticipantEntity = await _quizDomain.getQuizParticipant(
        mockQuizParticipantId,
        mockUserId
      );

      expect(_quizParticipantRepo.getQuizParticipantById).toBeCalledWith(mockQuizParticipantId);
      expect(quizParticipantEntity).toEqual(mockQuizParticipantEntity);
    });

    it('should return a quiz participant with hide result', async () => {
      const mockQuizParticipantEntity = createMockQuizParticipantEntity({
        id: mockQuizParticipantId,
        createdBy: mockUserId,
        finishedAt: new Date(),
      });

      _quizParticipantRepo.getQuizParticipantById.mockResolvedValue(mockQuizParticipantEntity);

      mockQuizParticipantEntity.hideResult();

      const quizParticipantEntity = await _quizDomain.getQuizParticipant(
        mockQuizParticipantId,
        mockUserId
      );

      expect(_quizParticipantRepo.getQuizParticipantById).toBeCalledWith(mockQuizParticipantId);
      expect(quizParticipantEntity).toEqual(mockQuizParticipantEntity);
    });

    it('should throw error if user access denied', async () => {
      const mockQuizParticipantEntity = createMockQuizParticipantEntity({
        id: mockQuizParticipantId,
      });

      _quizParticipantRepo.getQuizParticipantById.mockResolvedValue(mockQuizParticipantEntity);

      try {
        await _quizDomain.getQuizParticipant(mockQuizParticipantId, mockUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentAccessDeniedException);
        expect(_quizParticipantRepo.getQuizParticipantById).toBeCalledWith(mockQuizParticipantId);
      }
    });
  });

  describe('calculateHighestScore', () => {
    const mockQuizParticipantEntity = createMockQuizParticipantEntity({
      score: 90,
      finishedAt: new Date(),
    });

    it('should calculate highest score with update highest score successfully', async () => {
      const mockHighestQuizParticipantEntity = createMockQuizParticipantEntity({
        score: 80,
        isHighest: true,
      });

      _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId.mockResolvedValue(
        mockHighestQuizParticipantEntity
      );

      await _quizDomain.calculateHighestScore(mockQuizParticipantEntity);

      expect(
        _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId
      ).toBeCalledWith(
        mockQuizParticipantEntity.get('contentId'),
        mockQuizParticipantEntity.get('createdBy')
      );
      expect(_quizParticipantRepo.updateIsHighest).toBeCalledTimes(2);
    });

    it('should calculate highest score without update highest score successfully', async () => {
      const mockHighestQuizParticipantEntity = createMockQuizParticipantEntity({
        score: 100,
        isHighest: true,
      });

      _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId.mockResolvedValue(
        mockHighestQuizParticipantEntity
      );

      await _quizDomain.calculateHighestScore(mockQuizParticipantEntity);

      expect(
        _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId
      ).toBeCalledWith(
        mockQuizParticipantEntity.get('contentId'),
        mockQuizParticipantEntity.get('createdBy')
      );
      expect(_quizParticipantRepo.updateIsHighest).not.toBeCalled();
    });

    it('should throw error if quiz participant is not finish', async () => {
      const mockQuizParticipantEntity = createMockQuizParticipantEntity({ score: 90 });

      try {
        await _quizDomain.calculateHighestScore(mockQuizParticipantEntity);
      } catch (error) {
        expect(error).toBeInstanceOf(QuizParticipantNotFinishedException);
        expect(
          _quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId
        ).not.toBeCalled();
        expect(_quizParticipantRepo.updateIsHighest).not.toBeCalled();
      }
    });
  });
});
