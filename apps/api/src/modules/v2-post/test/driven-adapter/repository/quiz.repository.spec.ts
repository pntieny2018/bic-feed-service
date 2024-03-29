import {
  FindAllQuizProps,
  FindOneQuizProps,
  GetPaginationQuizzesProps,
  IQuizRepository,
} from '../../../domain/repositoty-interface';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizRepository } from '../../../driven-adapter/repository/quiz.repository';
import { Sequelize } from 'sequelize-typescript';
import { createMock } from '@golevelup/ts-jest';
import { FindOptions, Transaction } from 'sequelize';
import { getModelToken } from '@nestjs/sequelize';
import { IQuiz, QuizModel } from '../../../../../database/models/quiz.model';
import {
  IQuizFactory,
  QUIZ_FACTORY_TOKEN,
} from '../../../domain/factory/interface/quiz.factory.interface';
import { QuizFactory } from '../../../domain/factory/quiz.factory';
import { quizEntityMock } from '../../mock/quiz.entity.mock';
import { quizRecordMock } from '../../mock/quiz.model.mock';
import { QuizEntity } from '../../../domain/model/quiz';
import { PostType } from '../../../data-type';
import { CursorPaginator, OrderEnum } from '../../../../../common/dto';
import { PostModel } from '../../../../../database/models/post.model';

const transaction = createMock<Transaction>();

describe('QuizRepository', () => {
  let repo: IQuizRepository;
  let factory;
  let quizModel;
  let sequelizeConnection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizRepository,
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
        {
          provide: getModelToken(QuizModel),
          useValue: createMock<QuizModel>(),
        },
        {
          provide: QUIZ_FACTORY_TOKEN,
          useValue: createMock<QuizFactory>(),
        },
      ],
    }).compile();
    repo = module.get<IQuizRepository>(QuizRepository);
    factory = module.get<IQuizFactory>(QUIZ_FACTORY_TOKEN);
    quizModel = module.get<QuizModel>(getModelToken(QuizModel));
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Should create quiz successfully', async () => {
      const spyOnModelCreate = jest.spyOn(quizModel, 'create').mockResolvedValue(quizEntityMock);

      await repo.create(quizEntityMock);
      expect(spyOnModelCreate).toBeCalledTimes(1);
      expect(spyOnModelCreate).toBeCalledWith({
        id: quizEntityMock.get('id'),
        title: quizEntityMock.get('title'),
        contentId: quizEntityMock.get('contentId'),
        description: quizEntityMock.get('description'),
        numberOfQuestions: quizEntityMock.get('numberOfQuestions'),
        numberOfAnswers: quizEntityMock.get('numberOfAnswers'),
        numberOfQuestionsDisplay: quizEntityMock.get('numberOfQuestionsDisplay'),
        numberOfAnswersDisplay: quizEntityMock.get('numberOfAnswersDisplay'),
        status: quizEntityMock.get('status'),
        genStatus: quizEntityMock.get('genStatus'),
        error: quizEntityMock.get('error'),
        isRandom: quizEntityMock.get('isRandom'),
        questions: quizEntityMock.get('questions'),
        createdBy: quizEntityMock.get('createdBy'),
        updatedBy: quizEntityMock.get('updatedBy'),
        createdAt: quizEntityMock.get('createdAt'),
        updatedAt: quizEntityMock.get('updatedAt'),
        meta: quizEntityMock.get('meta'),
      });
    });
  });

  describe('update', () => {
    it('Should update quiz successfully', async () => {
      const spyOnModelUpdate = jest.spyOn(quizModel, 'update').mockResolvedValue(quizEntityMock);

      await repo.update(quizEntityMock);
      expect(spyOnModelUpdate).toBeCalledTimes(1);
      expect(spyOnModelUpdate).toBeCalledWith(
        {
          title: quizEntityMock.get('title'),
          description: quizEntityMock.get('description'),
          numberOfQuestions: quizEntityMock.get('numberOfQuestions'),
          numberOfAnswers: quizEntityMock.get('numberOfAnswers'),
          numberOfQuestionsDisplay: quizEntityMock.get('numberOfQuestionsDisplay'),
          numberOfAnswersDisplay: quizEntityMock.get('numberOfAnswersDisplay'),
          status: quizEntityMock.get('status'),
          error: quizEntityMock.get('error'),
          genStatus: quizEntityMock.get('genStatus'),
          isRandom: quizEntityMock.get('isRandom'),
          questions: quizEntityMock.get('questions'),
          updatedBy: quizEntityMock.get('updatedBy'),
          updatedAt: quizEntityMock.get('updatedAt'),
          meta: quizEntityMock.get('meta'),
        },
        { where: { id: quizEntityMock.get('id') } }
      );
    });
  });

  describe('delete', () => {
    it('Should delete quiz successfully', async () => {
      const spyOnModelDelete = jest.spyOn(quizModel, 'destroy').mockResolvedValue(quizEntityMock);

      await repo.delete(quizEntityMock.get('id'));
      expect(spyOnModelDelete).toBeCalledTimes(1);
      expect(spyOnModelDelete).toBeCalledWith({ where: { id: quizEntityMock.get('id') } });
    });
  });

  describe('find quiz', () => {
    it('Should findOne quiz successfully', async () => {
      const findOneOptions: FindOneQuizProps = {
        where: { id: quizEntityMock.get('id') },
        attributes: ['id'],
      };

      const spyOnModelFindOne = jest.spyOn(quizModel, 'findOne').mockResolvedValue({
        toJSON: () => quizRecordMock,
      });
      jest.spyOn(factory, 'reconstitute').mockReturnValue(quizEntityMock);

      const result = await repo.findOne(findOneOptions);

      expect(spyOnModelFindOne).toBeCalledWith(findOneOptions);

      expect(result).toEqual(quizEntityMock);
    });

    it('should return null if quiz not found', async () => {
      const findOneOptions: FindOneQuizProps = {
        where: { id: quizEntityMock.get('id') },
        attributes: ['id'],
      };

      const spyOnModelFindOne = jest.spyOn(quizModel, 'findOne').mockResolvedValue(null);

      const result = await repo.findOne(findOneOptions);

      expect(spyOnModelFindOne).toBeCalledWith(findOneOptions);
      expect(result).toBeNull();
    });

    it('should find all quiz successfully', async () => {
      const findAllOptions: FindAllQuizProps = {
        where: {
          ids: [quizEntityMock.get('id')],
          status: quizEntityMock.get('status'),
          contentIds: [quizEntityMock.get('contentId')],
        },
        attributes: ['id'],
      };
      const spyOnModelFindAll = jest.spyOn(quizModel, 'findAll').mockResolvedValue([
        {
          toJSON: () => quizRecordMock,
        },
      ]);
      jest.spyOn(factory, 'reconstitute').mockReturnValue(new QuizEntity(quizRecordMock));

      const result = await repo.findAll(findAllOptions);

      expect(spyOnModelFindAll).toBeCalledTimes(1);
      expect(spyOnModelFindAll).toBeCalledWith({
        where: {
          id: [quizEntityMock.get('id')],
          status: quizEntityMock.get('status'),
          contentId: [quizEntityMock.get('contentId')],
        },
        attributes: ['id'],
      });
      expect(result).toEqual([new QuizEntity(quizRecordMock)]);
    });
  });

  it('should find all quiz successfully with contentId', async () => {
    const findAllOptions: FindAllQuizProps = {
      where: {
        ids: [quizEntityMock.get('id')],
        status: quizEntityMock.get('status'),
        contentId: quizEntityMock.get('contentId'),
      },
      attributes: ['id'],
    };
    const spyOnModelFindAll = jest.spyOn(quizModel, 'findAll').mockResolvedValue([
      {
        toJSON: () => quizRecordMock,
      },
    ]);
    jest.spyOn(factory, 'reconstitute').mockReturnValue(new QuizEntity(quizRecordMock));

    const result = await repo.findAll(findAllOptions);

    expect(spyOnModelFindAll).toBeCalledTimes(1);
    expect(spyOnModelFindAll).toBeCalledWith({
      where: {
        id: [quizEntityMock.get('id')],
        status: quizEntityMock.get('status'),
        contentId: quizEntityMock.get('contentId'),
      },
      attributes: ['id'],
    });
    expect(result).toEqual([new QuizEntity(quizRecordMock)]);
  });

  describe('getPagination', () => {
    it('should return a CursorPaginationResult object', async () => {
      const getPaginationQuizzesProps: GetPaginationQuizzesProps = {
        where: { status: quizRecordMock.status, createdBy: quizRecordMock.createdBy },
        contentType: PostType.POST,
        attributes: ['id', 'postId', 'createdAt'],
        limit: 10,
        order: OrderEnum.DESC,
      };
      const findOptions: FindOptions<IQuiz> = {
        where: getPaginationQuizzesProps.where,
        attributes: getPaginationQuizzesProps.attributes,
        include: [
          {
            model: PostModel,
            attributes: ['id'],
            as: 'post',
            required: true,
            where: {
              isHidden: false,
              type: PostType.POST,
            },
          },
        ],
      };

      jest.spyOn(factory, 'reconstitute').mockReturnValue(quizEntityMock);
      jest.spyOn(quizModel, 'findAll').mockResolvedValue([
        {
          toJSON: () => quizRecordMock,
        },
      ]);

      const paginator = new CursorPaginator(
        quizModel,
        ['createdAt'],
        { limit: getPaginationQuizzesProps.limit },
        getPaginationQuizzesProps.order
      );
      const { rows, meta } = await paginator.paginate(findOptions);

      const result = await repo.getPagination(getPaginationQuizzesProps);

      expect(result.rows).toEqual(rows.map((row) => new QuizEntity(row.toJSON())));
      expect(result.meta).toEqual(meta);
    });

    it('should limit to be default if not provided', async () => {
      const props = {
        where: { status: quizRecordMock.status, createdBy: quizRecordMock.createdBy },
        contentType: PostType.POST,
        attributes: ['id', 'contentId', 'createdAt'],
        order: OrderEnum.DESC,
      };
      jest.spyOn(quizModel, 'findAll').mockResolvedValue([
        {
          toJSON: () => quizRecordMock,
        },
      ]);
      const result = await repo.getPagination(props as GetPaginationQuizzesProps);

      expect(quizModel.findAll).toBeCalledWith({
        where: { status: quizRecordMock.status, createdBy: quizRecordMock.createdBy },
        attributes: props.attributes,
        include: [
          {
            model: PostModel,
            attributes: ['id'],
            as: 'post',
            required: true,
            where: {
              isHidden: false,
              type: PostType.POST,
            },
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 11,
      });
    });
  });
});
