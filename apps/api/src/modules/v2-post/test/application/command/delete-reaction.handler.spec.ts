import { DeleteReactionCommand } from '../../../application/command/delete-reaction/delete-reaction.command';
import { userMock } from '../../mock/user.dto.mock';
import { POST_REACTION_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { PostReactionRepository } from '../../../driven-adapter/repository/post-reaction.repository';
import { DeleteReactionHandler } from '../../../application/command/delete-reaction/delete-reaction.handler';
import { v4 } from 'uuid';
import { I18nContext } from 'nestjs-i18n';
import { ReactionEntity } from '../../../domain/model/reaction';
import { ReactionNotFoundException } from '../../../domain/exception';
import { REACTION_DOMAIN_SERVICE_TOKEN } from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDomainService } from '../../../domain/domain-service/reaction.domain-service';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { TestBed } from '@automock/jest';

describe('DeleteReactionHandler', () => {
  let handler: DeleteReactionHandler;
  let repo: PostReactionRepository;
  let domainService: ReactionDomainService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(DeleteReactionHandler).compile();

    handler = unit;
    repo = unitRef.get(POST_REACTION_REPOSITORY_TOKEN);
    domainService = unitRef.get(REACTION_DOMAIN_SERVICE_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
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
      const reactionEntity = new ReactionEntity(reactionRecord);
      jest.spyOn(repo, 'findOne').mockResolvedValue(reactionEntity);
      await handler.execute(command);
      expect(domainService.deleteReaction).toBeCalledWith(target, reactionRecord.id);
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
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      await expect(handler.execute(command)).rejects.toThrowError(ReactionNotFoundException);
    });
  });
});
