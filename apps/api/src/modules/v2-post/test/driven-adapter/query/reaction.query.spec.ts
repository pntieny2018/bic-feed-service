import { ReactionEntity } from '../../../domain/model/reaction';
import { PostReactionModel } from '../../../../../database/models/post-reaction.model';
import { CommentReactionModel } from '../../../../../database/models/comment-reaction.model';
import { getModelToken } from '@nestjs/sequelize';
import { createMock } from '@golevelup/ts-jest';
import { ReactionQuery } from '../../../driven-adapter/query/reaction.query';
import { Test, TestingModule } from '@nestjs/testing';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionFactory } from '../../../domain/factory/reaction.factory';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { v4 } from 'uuid';

describe('ReactionQuery', () => {
  let query: ReactionQuery;
  let postReactionModel;
  let commentReactionModel;
  let factory: IReactionFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionQuery,
        {
          provide: getModelToken(PostReactionModel),
          useFactory: () => ({
            findAndCountAll: jest.fn(),
          }),
        },
        {
          provide: getModelToken(CommentReactionModel),
          useFactory: () => ({
            findAndCountAll: jest.fn(),
          }),
        },
        {
          provide: REACTION_FACTORY_TOKEN,
          useValue: createMock<ReactionFactory>(),
        },
      ],
    }).compile();

    query = module.get<ReactionQuery>(ReactionQuery);
    postReactionModel = module.get(getModelToken(PostReactionModel));
    commentReactionModel = module.get(getModelToken(CommentReactionModel));
    factory = module.get(REACTION_FACTORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const postReactionRecord = {
    id: v4(),
    reactionName: '+1',
    target: REACTION_TARGET.POST,
    targetId: v4(),
    createdBy: v4(),
  };

  const commentReactionRecord = {
    id: v4(),
    reactionName: '+1',
    target: REACTION_TARGET.COMMENT,
    targetId: v4(),
    createdBy: v4(),
  };

  const postReactionEntity: ReactionEntity = new ReactionEntity(postReactionRecord);
  const commentReactionEntity: ReactionEntity = new ReactionEntity(commentReactionRecord);

  describe('getPagination', () => {
    const input = {
      reactionName: '+1',
      target: REACTION_TARGET.POST,
      targetId: v4(),
      limit: 10,
      order: 'ASC',
      latestId: null,
    };

    it('should return post reaction pagination', async () => {
      jest
        .spyOn(postReactionModel, 'findAndCountAll')
        .mockResolvedValue({ rows: [postReactionRecord], count: 1 });
      const result = await query.getPagination(input);
      expect(postReactionModel.findAndCountAll).toBeCalled();
    });
  });
});
