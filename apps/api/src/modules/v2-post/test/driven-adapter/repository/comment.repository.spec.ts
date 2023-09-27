import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import {
  CommentReactionModel,
  ICommentReaction,
} from '../../../../../database/models/comment-reaction.model';
import { CommentModel, IComment } from '../../../../../database/models/comment.model';
import { CommentFactory } from '../../../domain/factory';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../../domain/factory/interface';
import { CommentRepository } from '../../../driven-adapter/repository/comment.repository';
import { createMockCommentEntity, createMockCommentRecord } from '../../mock/comment.mock';

const transaction = createMock<Transaction>();
const commentRecord = createMockCommentRecord();
const commentEntityMock = createMockCommentEntity();

describe('CommentRepository', () => {
  let repo;
  let factory;
  let commentModel, commentReactionModel;
  let sequelizeConnection;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentRepository,
        {
          provide: COMMENT_FACTORY_TOKEN,
          useValue: createMock<CommentFactory>(),
        },
        {
          provide: getModelToken(CommentModel),
          useValue: createMock<CommentModel>(),
        },
        {
          provide: getModelToken(CommentReactionModel),
          useValue: createMock<CommentReactionModel>(),
        },
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
      ],
    }).compile();
    repo = module.get<CommentRepository>(CommentRepository);
    factory = module.get<ICommentFactory>(COMMENT_FACTORY_TOKEN);
    commentModel = module.get<IComment>(getModelToken(CommentModel));
    commentReactionModel = module.get<ICommentReaction>(getModelToken(CommentReactionModel));
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('Should create comment successfully', async () => {
      const spyCreate = jest.spyOn(commentModel, 'create').mockResolvedValue(commentRecord);
      const spyFactory = jest.spyOn(factory, 'reconstitute').mockResolvedValue(commentEntityMock);
      const result = await repo.createComment(commentEntityMock);

      expect(spyCreate).toBeCalled();
      expect(spyFactory).toBeCalled();
      expect(result).toEqual(commentEntityMock);
    });
  });

  describe('findOne', () => {
    it('Should has a comment', async () => {
      const spyFindOne = jest.spyOn(commentModel, 'findOne').mockResolvedValue(commentRecord);
      const spyFactory = jest.spyOn(factory, 'reconstitute').mockResolvedValue(commentEntityMock);
      const result = await repo.findOne({ id: commentRecord.id });

      expect(spyFindOne).toBeCalled();
      expect(spyFactory).toBeCalled();
      expect(result).toEqual(commentEntityMock);
    });

    it('Should return null', async () => {
      const spyFindOne = jest.spyOn(commentModel, 'findOne').mockResolvedValue(null);
      const result = await repo.findOne({ id: commentRecord.id });

      expect(spyFindOne).toBeCalled();
      expect(result).toEqual(null);
    });
  });

  describe('update', () => {
    it('Should create comment successfully', async () => {
      const spyUpdate = jest.spyOn(commentModel, 'update').mockResolvedValue(true);
      const result = await repo.update(commentEntityMock);

      expect(spyUpdate).toBeCalled();
      expect(result).toEqual(undefined);
    });

    it('Should throw exception', async () => {
      const spyUpdate = jest.spyOn(commentModel, 'update').mockRejectedValue(new Error());
      try {
        await repo.update(commentEntityMock);
      } catch (e) {
        expect(spyUpdate).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe('destroyComment', () => {
    it('Should delete comment successfully', async () => {
      const spyDelete = jest.spyOn(commentModel, 'destroy').mockResolvedValue(undefined);
      const spyDeleteReaction = jest
        .spyOn(commentReactionModel, 'destroy')
        .mockResolvedValue(undefined);

      await repo.destroyComment(commentRecord.id);

      expect(spyDelete).toBeCalled();
      expect(spyDeleteReaction).toBeCalled();
      expect(transaction.commit).toBeCalled();
    });

    it('Should throw a exception', async () => {
      const spyDelete = jest.spyOn(commentModel, 'destroy').mockRejectedValue(new Error());
      const spyDeleteReaction = jest
        .spyOn(commentReactionModel, 'destroy')
        .mockResolvedValue(undefined);

      try {
        await repo.destroyComment(commentRecord.id);
      } catch (err) {
        expect(spyDelete).toBeCalled();
        expect(spyDeleteReaction).toBeCalled();
        expect(transaction.commit).toBeCalledTimes(0);
        expect(transaction.rollback).toBeCalled();
      }
    });
  });
});
