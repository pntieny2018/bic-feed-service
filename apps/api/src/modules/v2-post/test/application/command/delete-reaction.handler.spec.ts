import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { DeleteReactionCommand } from '../../../application/command/delete-reaction/delete-reaction.command';
import { DeleteReactionHandler } from '../../../application/command/delete-reaction/delete-reaction.handler';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDomainService } from '../../../domain/domain-service/reaction.domain-service';
import { ReactionNotFoundException } from '../../../domain/exception';
import { userMock } from '../../mock/user.dto.mock';

describe('DeleteReactionHandler', () => {
  let handler: DeleteReactionHandler;
  let domainService: ReactionDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReactionHandler,
        {
          provide: REACTION_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IReactionDomainService>(),
        },
      ],
    }).compile();

    handler = module.get<DeleteReactionHandler>(DeleteReactionHandler);
    domainService = module.get<ReactionDomainService>(REACTION_DOMAIN_SERVICE_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete reaction success', async () => {
      const targetId = v4();
      const target = REACTION_TARGET.POST;
      const command = new DeleteReactionCommand({
        reactionName: '+1',
        target: target,
        targetId: targetId,
        userId: userMock.id,
      });
      const reactionRecord = {
        id: v4(),
        createdBy: userMock.id,
        targetId,
        target: target,
        reactionName: '+1',
      };
      await handler.execute(command);
      expect(domainService.deleteReaction).toBeCalledWith(command.payload);
    });

    it('should throw error when reaction not found', async () => {
      const targetId = v4();
      const target = REACTION_TARGET.POST;
      const command = new DeleteReactionCommand({
        reactionName: '+1',
        target: target,
        targetId: targetId,
        userId: userMock.id,
      });
      jest
        .spyOn(domainService, 'deleteReaction')
        .mockRejectedValueOnce(new ReactionNotFoundException());
      await expect(handler.execute(command)).rejects.toThrowError(ReactionNotFoundException);
    });
  });
});
