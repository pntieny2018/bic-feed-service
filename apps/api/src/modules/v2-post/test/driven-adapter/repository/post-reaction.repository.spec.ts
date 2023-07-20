import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../../domain/repositoty-interface';
import { Test } from '@nestjs/testing';
import { PostReactionRepository } from '../../../driven-adapter/repository/post-reaction.repository';
import { createMock } from '@golevelup/ts-jest';
import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PostReactionModel } from '../../../../../database/models/post-reaction.model';
import { getModelToken } from '@nestjs/sequelize';
import { REACTION_FACTORY_TOKEN } from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../../../domain/factory/interface/reaction.factory';
import { ReactionEntity } from '../../../domain/model/reaction';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';

const mockReactionEntity = new ReactionEntity({
  id: '7b63852c-5249-499a-a32b-6bdaa2761fc1',
  reactionName: 'bic_check_mark',
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  createdAt: new Date(),
  target: REACTION_TARGET.POST,
  targetId: '7b63852c-5249-499a-a32b-6bdaa2761fc3',
});

const transaction = createMock<Transaction>();

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

  it('should create a new post reaction success', async () => {
    await repo.create(mockReactionEntity);
    expect(sequelizeConnection.transaction).toHaveBeenCalledWith(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      expect.any(Function)
    );
  });

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
});
