import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import { USER_APPLICATION_TOKEN, UserApplicationService } from '../../../../v2-user/application';
import { FindReactionsHandler } from '../../../application/query/reaction';
import { REACTION_TARGET } from '../../../data-type';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionEntity } from '../../../domain/model/reaction';

describe('FindReactionsPaginationHandler', () => {
  let userAppService, reactionDomainService, handler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReactionsHandler,
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<UserApplicationService>(),
        },
        {
          provide: REACTION_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IReactionDomainService>(),
        },
      ],
    }).compile();
    handler = module.get<FindReactionsHandler>(FindReactionsHandler);
    userAppService = module.get(USER_APPLICATION_TOKEN);
    reactionDomainService = module.get(REACTION_DOMAIN_SERVICE_TOKEN);
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
        .spyOn(reactionDomainService, 'getReactions')
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
