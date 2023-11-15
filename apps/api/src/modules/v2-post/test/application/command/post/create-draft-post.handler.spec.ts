import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import {
  CreateDraftPostCommandPayload,
  CreateDraftPostHandler,
} from '../../../../application/command/post';
import { CreateDraftPostDto } from '../../../../application/dto';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNoCRUDPermissionAtGroupException } from '../../../../domain/exception';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';
import { createMockGroupDto, createMockPostEntity, createMockUserDto } from '../../../mock';

describe('CreateDraftPostHandler', () => {
  let createDraftPostHandler: CreateDraftPostHandler;
  let postDomainService: IPostDomainService;
  let groupAdapter: IGroupAdapter;
  let contentValidator: IContentValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDraftPostHandler,
        {
          provide: POST_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IPostDomainService>(),
        },
        {
          provide: GROUP_ADAPTER,
          useValue: createMock<IGroupAdapter>(),
        },
        {
          provide: CONTENT_VALIDATOR_TOKEN,
          useValue: createMock<IContentValidator>(),
        },
      ],
    }).compile();

    createDraftPostHandler = module.get<CreateDraftPostHandler>(CreateDraftPostHandler);
    postDomainService = module.get<IPostDomainService>(POST_DOMAIN_SERVICE_TOKEN);
    groupAdapter = module.get<IGroupAdapter>(GROUP_ADAPTER);
    contentValidator = module.get<IContentValidator>(CONTENT_VALIDATOR_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userMock = createMockUserDto();
    const groupDtoMock = createMockGroupDto();
    const postEntityMock = createMockPostEntity();

    const mockCreateDraftPostDto: CreateDraftPostCommandPayload = {
      authUser: userMock,
      groupIds: [v4()],
    };

    it('should return CreateDraftPostDto', async () => {
      jest.spyOn(contentValidator, 'checkCanCRUDContent').mockResolvedValueOnce();
      jest.spyOn(groupAdapter, 'getGroupsByIds').mockResolvedValueOnce([groupDtoMock]);
      jest.spyOn(postDomainService, 'createDraftPost').mockResolvedValue(postEntityMock);

      const actual = await createDraftPostHandler.execute({
        payload: mockCreateDraftPostDto,
      });

      expect(actual).toEqual(
        new CreateDraftPostDto({
          id: postEntityMock.get('id'),
          audience: {
            groups: [groupDtoMock],
          },
          setting: postEntityMock.get('setting'),
        })
      );
    });

    it('should throw error when checkCanCRUDContent throw error', async () => {
      jest
        .spyOn(contentValidator, 'checkCanCRUDContent')
        .mockRejectedValue(new ContentNoCRUDPermissionAtGroupException());

      try {
        await createDraftPostHandler.execute({
          payload: mockCreateDraftPostDto,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ContentNoCRUDPermissionAtGroupException);
      }
    });
  });
});
