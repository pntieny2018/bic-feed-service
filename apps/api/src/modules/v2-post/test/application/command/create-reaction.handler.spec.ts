import { TestBed } from '@automock/jest';
import { CreateReactionHandler } from '../../../application/command/create-reaction/create-reaction.handler';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  ICommentRepository,
  IContentRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserApplicationService,
} from '../../../../v2-user/application';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { ReactionEntity } from '../../../domain/model/reaction';
import { createMock } from '@golevelup/ts-jest';
import { PostReactionRepository } from '../../../driven-adapter/repository/post-reaction.repository';
import { CommentReactionRepository } from '../../../driven-adapter/repository/comment-reaction.repository';
import { I18nContext } from 'nestjs-i18n';
import { userMock } from '../../mock/user.dto.mock';
import { ReactionDuplicateException } from '../../../domain/exception';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDomainService } from '../../../domain/domain-service/interface/reaction.domain-service';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { ContentEntity, PostEntity } from '../../../domain/model/content';
import { PostPrivacy, PostStatus, PostType } from '../../../data-type';

describe('CreateReactionHandler', () => {
  let handler: CreateReactionHandler;
  let postReactionRepository: IPostReactionRepository;
  let commentReactionRepository: ICommentReactionRepository;
  let reactionDomainService: IReactionDomainService;
  let userAppService: IUserApplicationService;
  let commentRepository: ICommentRepository;
  let contentRepository: IContentRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(CreateReactionHandler).compile();

    handler = unit;

    postReactionRepository = unitRef.get(POST_REACTION_REPOSITORY_TOKEN);
    commentReactionRepository = unitRef.get(COMMENT_REACTION_REPOSITORY_TOKEN);
    reactionDomainService = unitRef.get(REACTION_DOMAIN_SERVICE_TOKEN);
    userAppService = unitRef.get(USER_APPLICATION_TOKEN);
    commentRepository = unitRef.get(COMMENT_REPOSITORY_TOKEN);
    contentRepository = unitRef.get(CONTENT_REPOSITORY_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  describe('execute', () => {
    const command = {
      payload: {
        target: REACTION_TARGET.POST,
        targetId: v4(),
        reactionName: '+1',
        createdBy: v4(),
      },
    };

    const reactionRecord = {
      id: v4(),
      target: command.payload.target,
      targetId: command.payload.targetId,
      reactionName: command.payload.reactionName,
      createdBy: command.payload.createdBy,
    };
    const postRecord = {
      id: v4(),
      isReported: false,
      isHidden: false,
      createdBy: v4(),
      updatedBy: v4(),
      privacy: PostPrivacy.PRIVATE,
      status: PostStatus.PUBLISHED,
      type: PostType.POST,
      setting: {
        isImportant: false,
        canReact: true,
        canComment: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      media: {
        files: [],
        images: [],
        videos: [],
      },
      content: '',
      seriesIds: [],
      tags: [],
    };

    const reactionEntity = new ReactionEntity(reactionRecord);
    const postEntity = new PostEntity(postRecord);

    it('should success', async () => {
      jest.spyOn(postReactionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntity);
      jest.spyOn(reactionDomainService, 'createReaction').mockResolvedValue(reactionEntity);
      jest.spyOn(userAppService, 'findOne').mockResolvedValue(userMock);
      const result = await handler.execute(command);
      expect(result).toEqual({
        actor: userMock,
        id: reactionRecord.id,
        reactionName: reactionRecord.reactionName,
        target: reactionRecord.target,
        targetId: reactionRecord.targetId,
      });
    });

    it('should throw error when reaction already exists', async () => {
      jest.spyOn(postReactionRepository, 'findOne').mockResolvedValue(reactionEntity);
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntity);
      await expect(handler.execute(command)).rejects.toThrowError(ReactionDuplicateException);
    });
  });
});
