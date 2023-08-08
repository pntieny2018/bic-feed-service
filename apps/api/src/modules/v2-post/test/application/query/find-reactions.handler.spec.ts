import { ReactionEntity } from '../../../domain/model/reaction';
import { USER_APPLICATION_TOKEN, UserApplicationService } from '../../../../v2-user/application';
import { ReactionQuery } from '../../../driven-adapter/query/reaction.query';
import { Test, TestingModule } from '@nestjs/testing';
import { FindReactionsHandler } from '../../../application/query/find-reactions/find-reactions.handler';
import { REACTION_QUERY_TOKEN } from '../../../domain/query-interface/reaction.query.interface';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { createMock } from '@golevelup/ts-jest';
import { v4 } from 'uuid';

describe('FindReactionsPaginationHandler', () => {
  let userAppService, reactionQuery, handler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReactionsHandler,
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<UserApplicationService>(),
        },
        {
          provide: REACTION_QUERY_TOKEN,
          useValue: createMock<ReactionQuery>(),
        },
      ],
    }).compile();
    handler = module.get<FindReactionsHandler>(FindReactionsHandler);
    userAppService = module.get(USER_APPLICATION_TOKEN);
    reactionQuery = module.get(REACTION_QUERY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should find reactions success', async () => {
      const targetId = v4();
      const targetType = REACTION_TARGET.POST;
      const createdBy = v4();
      const createdBy2 = v4();
      const createdAt = new Date();
      const createdAt2 = new Date();
      const reactions = [
        {
          id: v4(),
          targetId: targetId,
          target: targetType,
          reactionName: '+1',
          createdBy: createdBy,
          createdAt: createdAt,
        },
        {
          id: v4(),
          targetId: targetId,
          target: targetType,
          reactionName: '+1',
          createdBy: createdBy2,
          createdAt: createdAt2,
        },
      ];
      const reactionEntities = reactions.map((reaction) => new ReactionEntity(reaction));
      jest
        .spyOn(reactionQuery, 'getPagination')
        .mockResolvedValue({ rows: reactionEntities, total: 2 });
      jest
        .spyOn(userAppService, 'findAllByIds')
        .mockResolvedValue([{ id: createdBy }, { id: createdBy2 }]);
      const result = await handler.execute({ targetId, targetType, createdBy });
      expect(result).toEqual({
        rows: [
          {
            id: reactions[0].id,
            reactionName: reactions[0].reactionName,
            createdAt: createdAt,
            actor: { id: createdBy },
          },
          {
            id: reactions[1].id,
            reactionName: reactions[1].reactionName,
            createdAt: createdAt2,
            actor: { id: createdBy2 },
          },
        ],
        total: 2,
      });
    });
  });
});
