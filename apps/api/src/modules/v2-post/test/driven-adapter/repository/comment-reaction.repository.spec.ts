import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { QueryTypes, Transaction, TransactionOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { getDatabaseConfig } from '../../../../../config/database';
import { CommentReactionModel } from '../../../../../database/models/comment-reaction.model';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../../../domain/factory/reaction.factory';
import {
  FindOnePostReactionProps,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface';
import { CommentReactionRepository } from '../../../driven-adapter/repository/comment-reaction.repository';
import {
  createMockCommentReactionRecord,
  createMockReactionEntity,
} from '../../mock/reaction.mock';

const commentReactionRecord = createMockCommentReactionRecord();
const commentReactionEntity = createMockReactionEntity();

const transaction = createMock<Transaction>();

describe('CommentReactionRepository', () => {
  let commentReactionRepository: ICommentReactionRepository;
  let sequelizeConnection;
  let reactionFactoryMock;
  let commentReactionModel;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CommentReactionRepository,
        {
          provide: REACTION_FACTORY_TOKEN,
          useValue: createMock<ReactionFactory>(),
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

    commentReactionRepository = moduleRef.get<CommentReactionRepository>(CommentReactionRepository);
    reactionFactoryMock = moduleRef.get<IReactionFactory>(REACTION_FACTORY_TOKEN);
    commentReactionModel = moduleRef.get<CommentReactionModel>(getModelToken(CommentReactionModel));
    sequelizeConnection = moduleRef.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should findOne return a ReactionEntity', async () => {
      const findOption: FindOnePostReactionProps = {
        postId: commentReactionEntity.get('targetId'),
      };
      jest
        .spyOn(commentReactionModel, 'findOne')
        .mockResolvedValue({ toJSON: () => commentReactionEntity });
      jest.spyOn(reactionFactoryMock, 'reconstitute').mockResolvedValue(commentReactionEntity);

      const result = await commentReactionRepository.findOne(findOption);
      expect(commentReactionModel.findOne).toBeCalledWith({
        where: findOption,
      });
      expect(result).toEqual(commentReactionEntity);
    });

    it('should find a null comment reaction', async () => {
      const findOption: FindOnePostReactionProps = {
        postId: commentReactionEntity.get('targetId'),
      };
      jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);

      const result = await commentReactionRepository.findOne(findOption);
      expect(commentReactionModel.findOne).toBeCalledWith({
        where: findOption,
      });
      expect(result).toBeNull();
    });
  });

  it('should create a new comment reaction success', async () => {
    const { schema } = getDatabaseConfig();
    const mockTransaction = { commit: jest.fn() };
    const mockTransactionFn = jest.fn((options: TransactionOptions, callback: Function) => {
      callback(mockTransaction);
      return Promise.resolve();
    });
    jest.spyOn(sequelizeConnection, 'transaction').mockImplementationOnce(mockTransactionFn as any);

    await commentReactionRepository.create(commentReactionEntity);

    expect(sequelizeConnection.transaction).toHaveBeenCalledWith(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      expect.any(Function)
    );
    expect(sequelizeConnection.query).toBeCalledTimes(1);
    expect(sequelizeConnection.query).toBeCalledWith(
      `CALL ${schema}.create_comment_reaction(?,?,?,null)`,
      {
        replacements: [
          commentReactionEntity.get('targetId'),
          commentReactionEntity.get('createdBy'),
          commentReactionEntity.get('reactionName'),
        ],
        transaction,
        type: QueryTypes.SELECT,
      }
    );
  });

  describe('delete', () => {
    it('should delete a comment reaction success', async () => {
      const destroySpy = jest.spyOn(commentReactionModel, 'destroy').mockResolvedValueOnce(1);

      await commentReactionRepository.delete(commentReactionRecord.id);

      expect(destroySpy).toBeCalledWith({
        where: { id: commentReactionRecord.id },
        transaction,
      });
      expect(transaction.commit).toBeCalled();
    });

    it('should delete rollback on error', async () => {
      jest
        .spyOn(sequelizeConnection, 'rollback')
        .mockImplementation(() => Promise.reject(new Error('Failed to rollback transaction')));

      const destroySpy = jest
        .spyOn(commentReactionModel, 'destroy')
        .mockResolvedValueOnce(new Error('Failed to delete comment reaction'));
      const logErrorSpy = jest
        .spyOn(commentReactionRepository['_logger'], 'error')
        .mockReturnThis();

      try {
        await commentReactionRepository.delete(commentReactionRecord.id);
      } catch (error) {
        expect(destroySpy).toBeCalledWith({
          where: { id: commentReactionRecord.id },
          transaction,
        });
        expect(transaction.rollback).toHaveBeenCalled();
        expect(transaction.commit).toBeCalledTimes(0);

        expect(logErrorSpy).toBeCalled();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should throw an error if the comment reaction cannot be deleted', async () => {
      const logErrorSpy = jest
        .spyOn(commentReactionRepository['_logger'], 'error')
        .mockReturnThis();

      commentReactionModel.destroy.mockRejectedValue(new Error('Error deleting comment reaction'));

      await expect(
        commentReactionRepository.delete(commentReactionRecord.id)
      ).rejects.toStrictEqual(new Error('Error deleting comment reaction'));
      expect(logErrorSpy).toBeCalled();
    });

    it('should rollback the transaction if an error is thrown', async () => {
      commentReactionModel.destroy.mockRejectedValue(new Error('Error deleting comment reaction'));
      transaction.rollback.mockReturnValue(Promise.resolve());

      await expect(
        commentReactionRepository.delete(commentReactionRecord.id)
      ).rejects.toStrictEqual(new Error('Error deleting comment reaction'));
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
