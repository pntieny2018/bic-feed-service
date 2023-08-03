import { PostReactionRepository } from '../../../driven-adapter/repository/post-reaction.repository';
import { CommentReactionRepository } from '../../../driven-adapter/repository/comment-reaction.repository';
import { I18nContext } from 'nestjs-i18n';
import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { IReactionDomainService } from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  IReactionFactory,
  REACTION_FACTORY_TOKEN,
} from '../../../domain/factory/interface/reaction.factory.interface';
import { ReactionDomainService } from '../../../domain/domain-service/reaction.domain-service';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';
import { ReactionFactory } from '../../../domain/factory/interface/reaction.factory';
import { createMock } from '@golevelup/ts-jest';
import { v4 } from 'uuid';

describe('ReactionDomainService', () => {
  let domainService: IReactionDomainService;
  let postRepo: IPostReactionRepository;
  let commentRepo: ICommentReactionRepository;
  let factory: IReactionFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionDomainService,
        {
          provide: REACTION_FACTORY_TOKEN,
          useValue: createMock<ReactionFactory>(),
        },
        {
          provide: POST_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<PostReactionRepository>(),
        },
        {
          provide: COMMENT_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<CommentReactionRepository>(),
        },
      ],
    }).compile();

    domainService = module.get<ReactionDomainService>(ReactionDomainService);
    postRepo = module.get(POST_REACTION_REPOSITORY_TOKEN);
    commentRepo = module.get(COMMENT_REACTION_REPOSITORY_TOKEN);
    factory = module.get(REACTION_FACTORY_TOKEN);
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
      jest.spyOn(postRepo, 'delete').mockResolvedValue(undefined);
      const result = await domainService.deleteReaction(
        postReactionRecord.target,
        postReactionRecord.id
      );
      expect(postRepo.delete).toBeCalledWith(postReactionRecord.id);
    });

    it('should delete comment reaction', async () => {
      jest.spyOn(commentRepo, 'delete').mockResolvedValue(undefined);
      const result = await domainService.deleteReaction(
        commentReactionRecord.target,
        commentReactionRecord.id
      );
      expect(commentRepo.delete).toBeCalledWith(commentReactionRecord.id);
    });

    it('should throw error when target is invalid', async () => {
      jest.spyOn(postRepo, 'delete').mockRejectedValue(new Error());
      await expect(
        domainService.deleteReaction(postReactionRecord.target, 'invalid')
      ).rejects.toEqual(new DatabaseException());
    });
  });
});
