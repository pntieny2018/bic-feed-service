import { CreateReactionHandler } from '../../../application/command/create-reaction/create-reaction.handler';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
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
import { ReactionDomainService } from '../../../domain/domain-service/reaction.domain-service';
import { REACTION_TARGET } from '../../../data-type/reaction.enum';

describe('CreateReactionHandler', () => {
  let handler: CreateReactionHandler;
  let postReactionRepository: IPostReactionRepository;
  let commentReactionRepository: ICommentReactionRepository;
  let reactionDomainService: IReactionDomainService;
  let userAppService: IUserApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReactionHandler,
        {
          provide: POST_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<PostReactionRepository>(),
        },
        {
          provide: COMMENT_REACTION_REPOSITORY_TOKEN,
          useValue: createMock<CommentReactionRepository>(),
        },
        {
          provide: REACTION_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<ReactionDomainService>(),
        },
        {
          provide: USER_APPLICATION_TOKEN,
          useValue: createMock<UserApplicationService>(),
        },
      ],
    }).compile();

    handler = module.get<CreateReactionHandler>(CreateReactionHandler);
    postReactionRepository = module.get<IPostReactionRepository>(POST_REACTION_REPOSITORY_TOKEN);
    commentReactionRepository = module.get<ICommentReactionRepository>(
      COMMENT_REACTION_REPOSITORY_TOKEN
    );
    reactionDomainService = module.get<IReactionDomainService>(REACTION_DOMAIN_SERVICE_TOKEN);
    userAppService = module.get<IUserApplicationService>(USER_APPLICATION_TOKEN);

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

    const reactionEntity = new ReactionEntity(reactionRecord);

    it('should success', async () => {
      jest.spyOn(postReactionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(reactionDomainService, 'createReaction').mockResolvedValue(reactionEntity);
      jest.spyOn(userAppService, 'findOne').mockResolvedValue(userMock);
      const result = await handler.execute(command);
      expect(result).toEqual({
        actor: userMock,
        id: reactionRecord.id,
        reactionName: reactionRecord.reactionName,
      });
    });

    it('should throw error when reaction already exists', async () => {
      jest.spyOn(postReactionRepository, 'findOne').mockResolvedValue(reactionEntity);
      await expect(handler.execute(command)).rejects.toThrowError(ReactionDuplicateException);
    });
  });
});
