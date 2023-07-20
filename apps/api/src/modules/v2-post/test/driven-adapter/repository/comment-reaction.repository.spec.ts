import { Test } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import { CommentReactionRepository } from '../../../driven-adapter/repository/comment-reaction.repository';
import {
  CommentReactionModel,
  ICommentReaction,
} from '../../../../../database/models/comment-reaction.model';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../../domain/factory/interface/reaction.factory.interface';
import { createMock } from '@golevelup/ts-jest';
import { ReactionFactory } from '../../../domain/factory/interface/reaction.factory';
import { getModelToken } from '@nestjs/sequelize';
import {
  FindOneCommentReactionProps,
  FindOnePostReactionProps,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface';
import { ReactionEntity } from '../../../domain/model/reaction';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { Sequelize } from 'sequelize-typescript';

const commentReactionRecord: ICommentReaction = {
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  commentId: '7b63852c-5249-499a-a32b-6bdaa2761fc3',
  reactionName: 'bic_check_mark',
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  createdAt: new Date(),
};

const commentReactionEntity = new ReactionEntity({
  ...commentReactionRecord,
  target: REACTION_TARGET.COMMENT,
  targetId: commentReactionRecord.commentId,
});

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

  it('should create a new comment reaction success', async () => {
    await commentReactionRepository.create(commentReactionEntity);

    expect(sequelizeConnection.transaction).toHaveBeenCalledWith(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      expect.any(Function)
    );
  });

  it('should delete a comment reaction success', async () => {
    const destroySpy = jest.spyOn(commentReactionModel, 'destroy').mockResolvedValueOnce(1);

    await commentReactionRepository.delete(commentReactionRecord.id);

    expect(destroySpy).toBeCalledWith({
      where: { id: commentReactionRecord.id },
      transaction,
    });
    expect(transaction.commit).toBeCalled();
  });

  it('should not delete a comment reaction', async () => {
    const logErrorSpy = jest.spyOn(commentReactionRepository['_logger'], 'error').mockReturnThis();
    const destroySpy = jest.spyOn(commentReactionModel, 'destroy').mockReturnValue(new Error());
    try {
      await commentReactionRepository.delete(commentReactionRecord.id);
    } catch (error) {
      expect(logErrorSpy).toBeCalled();
      expect(destroySpy).toBeCalledWith({
        where: { id: commentReactionRecord.id },
        transaction,
      });
      expect(commentReactionModel.destroy).toBeCalled();
      expect(transaction.rollback).toBeCalled();
    }
  });
});
