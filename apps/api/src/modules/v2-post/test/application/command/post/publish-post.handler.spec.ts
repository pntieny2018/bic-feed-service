import { CONTENT_STATUS } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { groupMock } from '../../../../../v2-group/tests/mocks/group.mock';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../../application/binding';
import {
  PublishPostCommandPayload,
  PublishPostHandler,
} from '../../../../application/command/post';
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

describe('PublishPostHandler', () => {
  let publishPostHandler: PublishPostHandler;
  let postDomainService: IPostDomainService;
  let groupAdapter: IGroupAdapter;
  let userAdapter: IUserAdapter;
  let kafkaAdapter: IKafkaAdapter;
  let contentBinding: IContentBinding;
  let contentRepository: IContentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishPostHandler,
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

    publishPostHandler = module.get<PublishPostHandler>(PublishPostHandler);
    postDomainService = module.get<IPostDomainService>(POST_DOMAIN_SERVICE_TOKEN);
    groupAdapter = module.get<IGroupAdapter>(GROUP_ADAPTER);
    userAdapter = module.get<IUserAdapter>(USER_ADAPTER);
    kafkaAdapter = module.get<IKafkaAdapter>(KAFKA_ADAPTER);
    contentBinding = module.get<IContentBinding>(CONTENT_BINDING_TOKEN);
    contentRepository = module.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const payload: PublishPostCommandPayload = {
      id: postEntityMock.get('id'),
      groupIds: postEntityMock.get('groupIds'),
      authUser: userMock,
    };

    it('Should publish post successfully', async () => {
      jest.spyOn(postDomainService, 'publishPost').mockResolvedValue(postEntityMock);
      jest.spyOn(postEntityMock, 'getSnapshot').mockReturnValue({
        ...postEntityMock.getSnapshot(),
        status: CONTENT_STATUS.PROCESSING,
      });

      jest.spyOn(postEntityMock, 'getState').mockReturnValue({
        ...postEntityMock.getState(),
        isChangeStatus: true,
      });
      jest.spyOn(postEntityMock, 'isNotUsersSeen').mockReturnValue(true);
      jest.spyOn(postEntityMock, 'increaseTotalSeen').mockReturnThis();

      jest.spyOn(postDomainService, 'markSeen').mockReturnThis();
      jest.spyOn(postEntityMock, 'isImportant').mockReturnValue(false);
      jest.spyOn(postEntityMock, 'isChanged').mockReturnValue(true);

      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValue(groupMock);
      jest.spyOn(userAdapter, 'getUsersByIds').mockResolvedValue([userMock]);

      jest.spyOn(contentBinding, 'postBinding').mockResolvedValue(postMock);
      jest.spyOn(contentRepository, 'findOne').mockResolvedValue(postEntityMock);
      jest.spyOn(kafkaAdapter, 'emit').mockImplementation(jest.fn());

      const result = await publishPostHandler.execute({
        payload,
      });

      expect(result).toEqual(postMock);
      expect(postEntityMock.increaseTotalSeen).toBeCalledTimes(1);
      expect(postDomainService.markReadImportant).toBeCalledTimes(0);
      expect(kafkaAdapter.emit).toBeCalledTimes(1);
    });

    it('Should throw ContentNotFoundException', async () => {
      jest
        .spyOn(postDomainService, 'publishPost')
        .mockRejectedValue(new ContentNotFoundException());

      try {
        await publishPostHandler.execute({
          payload,
        });
      } catch (e) {
        expect(e).toEqual(new ContentNotFoundException());
      }
    });
  });
});
