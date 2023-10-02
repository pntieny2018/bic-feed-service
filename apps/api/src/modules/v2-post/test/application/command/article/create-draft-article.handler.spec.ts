import { Test } from '@nestjs/testing';

import { CreateDraftArticleHandler } from '../../../../application/command/article';

import clearAllMocks = jest.clearAllMocks;

import { createMock } from '@golevelup/ts-jest';

import { ContentBinding } from '../../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../../application/binding/binding-post/content.interface';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { createMockArticleDto, createMockArticleEntity } from '../../../mock/content.mock';
import { createMockUserDto } from '../../../mock/user.mock';

const articleEntityMock = createMockArticleEntity();
const articleDtoMock = createMockArticleDto();
const userMock = createMockUserDto();

describe('CreateDraftArticleHandler', () => {
  let handler: CreateDraftArticleHandler;
  let postDomainService: IPostDomainService;
  let contentBinding: ContentBinding;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateDraftArticleHandler,
        {
          provide: POST_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IPostDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<ContentBinding>(),
        },
      ],
    }).compile();
    handler = module.get(CreateDraftArticleHandler);
    postDomainService = module.get(POST_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterAll(async () => {
    clearAllMocks();
  });

  describe('execute', () => {
    it('should execute create draft article', async () => {
      jest.spyOn(postDomainService, 'createDraftArticle').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(contentBinding, 'articleBinding').mockResolvedValueOnce(articleDtoMock);

      const result = await handler.execute({
        payload: {
          authUser: userMock,
        },
      });

      expect(result).toEqual(articleDtoMock);
      expect(postDomainService.createDraftArticle).toBeCalledWith({
        userId: userMock.id,
        groups: [],
      });
      expect(contentBinding.articleBinding).toBeCalledWith(articleEntityMock, {
        actor: userMock,
        authUser: userMock,
      });
    });
  });
});
