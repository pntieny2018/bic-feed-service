import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { groupMock } from '../../../../../v2-group/tests/mocks/group.mock';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../../application/binding';
import { UpdatePostCommandPayload, UpdatePostHandler } from '../../../../application/command/post';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException } from '../../../../domain/exception';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../../domain/infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { postMock } from '../../../mock/post.dto.mock';
import { postEntityMock } from '../../../mock/post.entity.mock';
import { userMock } from '../../../mock/user.dto.mock';

describe('UpdatePostHandler', () => {
  let updatePostHandler: UpdatePostHandler;
  let postDomainService: IPostDomainService;
  let contentRepository: IContentRepository;
  let contentBinding: IContentBinding;
  let groupAdapter: IGroupAdapter;
  let userAdapter: IUserAdapter;
  let kafkaAdapter: IKafkaAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdatePostHandler,
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useValue: createMock<IContentRepository>(),
        },
        {
          provide: POST_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IPostDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
        {
          provide: GROUP_ADAPTER,
          useValue: createMock<IGroupAdapter>(),
        },
        {
          provide: USER_ADAPTER,
          useValue: createMock<IUserAdapter>(),
        },
        {
          provide: KAFKA_ADAPTER,
          useValue: createMock<IKafkaAdapter>(),
        },
      ],
    }).compile();

    updatePostHandler = moduleRef.get<UpdatePostHandler>(UpdatePostHandler);
    postDomainService = moduleRef.get<IPostDomainService>(POST_DOMAIN_SERVICE_TOKEN);
    contentRepository = moduleRef.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);
    contentBinding = moduleRef.get<IContentBinding>(CONTENT_BINDING_TOKEN);
    groupAdapter = moduleRef.get<IGroupAdapter>(GROUP_ADAPTER);
    userAdapter = moduleRef.get<IUserAdapter>(USER_ADAPTER);
    kafkaAdapter = moduleRef.get<IKafkaAdapter>(KAFKA_ADAPTER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const updatePostCommandPayload: UpdatePostCommandPayload = {
      id: postEntityMock.get('id'),
      groupIds: postEntityMock.get('groupIds'),
      authUser: userMock,
    };
    it('should execute successfully', async () => {
      jest.spyOn(postDomainService, 'updatePost').mockResolvedValue(postEntityMock);
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue(groupMock);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([userMock]);
      const postBindingSpy = jest.spyOn(contentBinding, 'postBinding').mockResolvedValue(postMock);
      jest.spyOn(postEntityMock, 'isChanged').mockReturnValue(true);

      const result = await updatePostHandler.execute({
        payload: updatePostCommandPayload,
      });

      expect(kafkaAdapter.emit).toBeCalledTimes(1);
      expect(result).toEqual(postMock);
      expect(postBindingSpy).toBeCalledWith(postEntityMock, {
        groups: groupMock,
        actor: updatePostCommandPayload.authUser,
        authUser: updatePostCommandPayload.authUser,
        mentionUsers: [userMock],
      });
    });

    it('should throw ContentNotFoundException', async () => {
      jest.spyOn(postDomainService, 'updatePost').mockRejectedValue(new ContentNotFoundException());

      try {
        await updatePostHandler.execute({
          payload: updatePostCommandPayload,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNotFoundException);
      }
    });
  });
});
