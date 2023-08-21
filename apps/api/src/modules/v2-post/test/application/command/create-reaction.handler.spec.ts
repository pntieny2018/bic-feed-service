import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { v4 } from 'uuid';

import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { CreateReactionHandler } from '../../../application/command/reaction';
import { PostPrivacy, PostStatus, PostType, REACTION_TARGET } from '../../../data-type';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDuplicateException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { userMock } from '../../mock/user.dto.mock';

describe('CreateReactionHandler', () => {
  let handler: CreateReactionHandler;
  let reactionDomainService: IReactionDomainService;
  let userAppService: IUserApplicationService;
  let postReactionRepository: IPostReactionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReactionHandler,
        {
          provide: POST_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<IPostReactionRepository>(),
        },
        {
          provide: COMMENT_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<ICommentReactionRepository>(),
        },
        {
          provide: REACTION_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IReactionDomainService>(),
        },
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<IUserApplicationService>(),
        },
        {
          provide: COMMENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<ICommentDomainService>(),
        },
        {
          provide: CONTENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IContentDomainService>(),
        },
      ],
    }).compile();

    handler = module.get<CreateReactionHandler>(CreateReactionHandler);

    reactionDomainService = module.get(REACTION_DOMAIN_SERVICE_TOKEN);
    userAppService = module.get(USER_APPLICATION_TOKEN);
    postReactionRepository = module.get(POST_REACTION_REPOSITORY_TOKEN);

    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      await expect(handler.execute(command)).rejects.toThrowError(ReactionDuplicateException);
    });
  });
});
