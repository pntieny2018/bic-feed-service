import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../../application/binding';
import { FindPostHandler } from '../../../../application/query/post';
import {
  IPostDomainService,
  IReactionDomainService,
  ISeriesDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  REACTION_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException } from '../../../../domain/exception';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { postMock } from '../../../mock/post.dto.mock';
import { postEntityMock } from '../../../mock/post.entity.mock';
import { userMock } from '../../../mock/user.dto.mock';

describe('FindPostHandler', () => {
  let handler: FindPostHandler;
  let postDomainService: IPostDomainService;
  let groupAdapter: IGroupAdapter;
  let userAdapter: IUserAdapter;
  let postValidator: IPostValidator;
  let reactionDomainService: IReactionDomainService;
  let contentBinding: IContentBinding;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPostHandler,
        {
          provide: GROUP_ADAPTER,
          useValue: createMock<IGroupAdapter>(),
        },
        {
          provide: USER_ADAPTER,
          useValue: createMock<IUserAdapter>(),
        },
        {
          provide: POST_VALIDATOR_TOKEN,
          useValue: createMock<IPostValidator>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
        {
          provide: REACTION_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IReactionDomainService>(),
        },
        {
          provide: POST_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IPostDomainService>(),
        },
        {
          provide: SERIES_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<ISeriesDomainService>(),
        },
      ],
    }).compile();

    handler = module.get<FindPostHandler>(FindPostHandler);
    postDomainService = module.get(POST_DOMAIN_SERVICE_TOKEN);
    groupAdapter = module.get(GROUP_ADAPTER);
    userAdapter = module.get(USER_ADAPTER);
    postValidator = module.get(POST_VALIDATOR_TOKEN);
    reactionDomainService = module.get(REACTION_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const payload = {
      postId: postMock.id,
      authUser: userMock,
    };
    it('should find post success', async () => {
      jest.spyOn(postDomainService, 'getPostById').mockResolvedValue(postEntityMock);
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue([]);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([]);
      jest.spyOn(postValidator, 'checkCanReadContent').mockImplementation(jest.fn());
      jest
        .spyOn(reactionDomainService, 'getAndCountReactionByContentIds')
        .mockResolvedValue(new Map());
      jest.spyOn(contentBinding, 'postBinding').mockResolvedValue(postMock);

      const result = await handler.execute({ payload });
      expect(result).toEqual(postMock);
      expect(contentBinding.postBinding).toBeCalledWith(postEntityMock, {
        groups: [],
        mentionUsers: [],
        series: undefined,
        reactionsCount: new Map().get(postEntityMock.getId()),
        authUser: userMock,
      });
    });

    it('should throw ContentNotFoundException', async () => {
      jest
        .spyOn(postDomainService, 'getPostById')
        .mockRejectedValue(new ContentNotFoundException());

      try {
        await handler.execute({ payload });
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });
  });
});
