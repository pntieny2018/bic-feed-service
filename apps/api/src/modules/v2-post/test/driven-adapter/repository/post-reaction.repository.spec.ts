import { CONTENT_TARGET } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { QueryTypes, Transaction, TransactionOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { getDatabaseConfig } from '../../../../../config/database';
import { PostReactionModel } from '../../../../../database/models/post-reaction.model';
import { REACTION_FACTORY_TOKEN } from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../../../domain/factory/reaction.factory';
import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../../domain/repositoty-interface';
import { PostReactionRepository } from '../../../driven-adapter/repository/post-reaction.repository';
import { createMockReactionEntity } from '../../mock/reaction.mock';

const transaction = createMock<Transaction>();
const mockReactionEntity = createMockReactionEntity({ target: CONTENT_TARGET.POST });

describe('PostReactionRepository', () => {
  let repo: IPostReactionRepository;
  let postReactionModel, postReactionFactory;
  let sequelizeConnection;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostReactionRepository,
        {
          provide: Sequelize,
          useValue: createMock<Sequelize>(),
        },
        {
          provide: getModelToken(PostReactionModel),
          useValue: createMock<PostReactionModel>(),
        },
        {
          provide: REACTION_FACTORY_TOKEN,
          useValue: createMock<ReactionFactory>(),
        },
      ],
    }).compile();

    repo = module.get<IPostReactionRepository>(PostReactionRepository);
    postReactionModel = module.get<PostReactionModel>(getModelToken(PostReactionModel));
    postReactionFactory = module.get<ReactionFactory>(REACTION_FACTORY_TOKEN);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    sequelizeConnection.transaction.mockResolvedValue(transaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should find one post reaction', async () => {
      const findOption: FindOnePostReactionProps = {
        postId: mockReactionEntity.get('targetId'),
      };
      jest
        .spyOn(postReactionModel, 'findOne')
        .mockResolvedValue({ toJSON: () => mockReactionEntity });
      jest.spyOn(postReactionFactory, 'reconstitute').mockResolvedValue(mockReactionEntity);

      const result = await repo.findOne(findOption);
      expect(postReactionModel.findOne).toBeCalledWith({
        where: findOption,
      });
      expect(result).toEqual(mockReactionEntity);
    });

    it('should find a null post reaction', async () => {
      const findOption: FindOnePostReactionProps = {
        postId: mockReactionEntity.get('targetId'),
      };
      jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);

      const result = await repo.findOne(findOption);
      expect(postReactionModel.findOne).toBeCalledWith({
        where: findOption,
      });
      expect(result).toBeNull();
    });
  });

  it('should create a new post reaction success', async () => {
    const { schema } = getDatabaseConfig();
    const mockTransaction = { commit: jest.fn() };
    const mockTransactionFn = jest.fn((options: TransactionOptions, callback: Function) => {
      callback(mockTransaction);
      return Promise.resolve();
    });
    jest.spyOn(sequelizeConnection, 'transaction').mockImplementationOnce(mockTransactionFn as any);

    await repo.create(mockReactionEntity);
    expect(sequelizeConnection.transaction).toHaveBeenCalledWith(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      expect.any(Function)
    );
    expect(sequelizeConnection.query).toBeCalledTimes(1);
    expect(sequelizeConnection.query).toBeCalledWith(
      `CALL ${schema}.create_post_reaction(?,?,?,null)`,
      {
        replacements: [
          mockReactionEntity.get('targetId'),
          mockReactionEntity.get('createdBy'),
          mockReactionEntity.get('reactionName'),
        ],
        transaction,
        type: QueryTypes.SELECT,
      }
    );
  });

  describe('delete', () => {
    it('should delete a post reaction success', async () => {
      const destroySpy = jest.spyOn(postReactionModel, 'destroy').mockResolvedValueOnce(1);

      await repo.delete(mockReactionEntity.get('id'));

      expect(destroySpy).toBeCalledWith({
        where: { id: mockReactionEntity.get('id') },
        transaction,
      });
      expect(transaction.commit).toBeCalled();
    });

    it('should not delete a post reaction', async () => {
      const logErrorSpy = jest.spyOn(repo['_logger'], 'error').mockReturnThis();
      const destroySpy = jest.spyOn(postReactionModel, 'destroy').mockReturnValue(new Error());
      try {
        await repo.delete(mockReactionEntity.get('id'));
      } catch (error) {
        expect(logErrorSpy).toBeCalled();
        expect(destroySpy).toBeCalledWith({
          where: { id: mockReactionEntity.get('id') },
          transaction,
        });
        expect(postReactionModel.destroy).toBeCalled();
        expect(transaction.rollback).toBeCalled();
      }
    });

    it('should throw an error if the post reaction cannot be deleted', async () => {
      const logErrorSpy = jest.spyOn(repo['_logger'], 'error').mockReturnThis();

      postReactionModel.destroy.mockRejectedValue(new Error('Error deleting post reaction'));

      await expect(repo.delete(mockReactionEntity.get('id'))).rejects.toStrictEqual(
        new Error('Error deleting post reaction')
      );
      expect(logErrorSpy).toBeCalled();
    });

    it('should rollback the transaction if an error is thrown', async () => {
      postReactionModel.destroy.mockRejectedValue(new Error('Error deleting post reaction'));
      transaction.rollback.mockReturnValue(Promise.resolve());

      await expect(repo.delete(mockReactionEntity.get('id'))).rejects.toStrictEqual(
        new Error('Error deleting post reaction')
      );
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
