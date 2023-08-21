import { createMock } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { OrderEnum } from '../../../../../common/dto';
import { DatabaseException } from '../../../../../common/exceptions';
import { REACTION_TARGET } from '../../../data-type';
import { IReactionDomainService } from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDomainService } from '../../../domain/domain-service/reaction.domain-service';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

describe('ReactionDomainService', () => {
  let domainService: IReactionDomainService;
  let postRepo: IPostReactionRepository;
  let reactionQuery: IReactionQuery;
  let commentRepo: ICommentReactionRepository;
  let factory: IReactionFactory;
  let eventBus$: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionDomainService,
        {
          provide: REACTION_QUERY_TOKEN,
          useValue: createMock<IReactionQuery>(),
        },
        {
          provide: REACTION_FACTORY_TOKEN,
          useValue: createMock<IReactionFactory>(),
        },
        {
          provide: POST_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<IPostReactionRepository>(),
        },
        {
          provide: COMMENT_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<ICommentReactionRepository>(),
        },
        {
          provide: EventBus,
          useFactory: () => jest.fn(),
        },
      ],
    }).compile();

    domainService = module.get<ReactionDomainService>(ReactionDomainService);
    postRepo = module.get(POST_REACTION_REPOSITORY_TOKEN);
    reactionQuery = module.get(REACTION_QUERY_TOKEN);
    commentRepo = module.get(COMMENT_REACTION_REPOSITORY_TOKEN);
    factory = module.get(REACTION_FACTORY_TOKEN);
    eventBus$ = module.get<EventBus>(EventBus);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    eventBus$.publish = jest.fn(() => {});

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

  describe('getReactions', () => {
    it('should get post reactions', async () => {
      jest.spyOn(reactionQuery, 'getPagination').mockResolvedValue({
        rows: [postReactionEntity],
        total: 1,
      });

      const result = await domainService.getReactions({
        reactionName: '+1',
        targetId: v4(),
        target: REACTION_TARGET.POST,
        latestId: v4(),
        order: OrderEnum.ASC,
        limit: 1,
      });
      expect(result).toEqual({
        rows: [postReactionEntity],
        total: 1,
      });
    });
  });

  describe('createReaction', () => {
    it('should create post reaction', async () => {
      const input = {
        reactionName: '+1',
        createdBy: v4(),
        target: REACTION_TARGET.POST,
        targetId: v4(),
      };
      jest.spyOn(factory, 'create').mockReturnValue(postReactionEntity);
      jest.spyOn(postRepo, 'create').mockResolvedValue(undefined);
      const result = await domainService.createReaction(input);

      expect(eventBus$.publish).toHaveBeenCalledTimes(1);
      expect(result).toEqual(postReactionEntity);
    });

    it('should create comment reaction', async () => {
      const input = {
        reactionName: '+1',
        createdBy: v4(),
        target: REACTION_TARGET.COMMENT,
        targetId: v4(),
      };
      jest.spyOn(factory, 'create').mockReturnValue(commentReactionEntity);
      jest.spyOn(commentRepo, 'create').mockResolvedValue(undefined);
      const result = await domainService.createReaction(input);

      expect(result).toEqual(commentReactionEntity);
    });

    it('should throw error when target is invalid', async () => {
      const input = {
        reactionName: '+1',
        createdBy: v4(),
        target: 'invalid' as any,
        targetId: v4(),
      };
      await expect(domainService.createReaction(input)).rejects.toEqual(new DatabaseException());
    });
  });

  describe('deleteReaction', () => {
    it('should delete post reaction', async () => {
      jest.spyOn(postRepo, 'findOne').mockResolvedValue(postReactionEntity);
      jest.spyOn(postRepo, 'delete').mockResolvedValue(undefined);
      const result = await domainService.deleteReaction({
        userId: postReactionRecord.createdBy,
        targetId: postReactionRecord.targetId,
        target: postReactionRecord.target,
        reactionId: postReactionRecord.id,
        reactionName: postReactionRecord.reactionName,
      });
      expect(eventBus$.publish).toHaveBeenCalledTimes(1);
      expect(postRepo.delete).toBeCalledWith(postReactionRecord.id);
    });

    it('should delete comment reaction', async () => {
      jest.spyOn(commentRepo, 'findOne').mockResolvedValue(commentReactionEntity);
      jest.spyOn(commentRepo, 'delete').mockResolvedValue(undefined);
      const result = await domainService.deleteReaction({
        userId: commentReactionRecord.createdBy,
        targetId: commentReactionRecord.targetId,
        target: commentReactionRecord.target,
        reactionId: commentReactionRecord.id,
        reactionName: commentReactionRecord.reactionName,
      });
      expect(commentRepo.delete).toBeCalledWith(commentReactionRecord.id);
    });
  });
});
