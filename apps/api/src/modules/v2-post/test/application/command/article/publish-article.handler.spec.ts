import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';

import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../../application/binding/binding-post/content.interface';
import { PublishArticleHandler } from '../../../../application/command/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IContentDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { createMockArticleDto, createMockArticleEntity } from '../../../mock/content.mock';
import { createMockUserDto } from '../../../mock/user.mock';

const articleEntityMock = createMockArticleEntity();
const articleDtoMock = createMockArticleDto();
const userMock = createMockUserDto();

describe('PublishArticleHandler', () => {
  let publishArticleHandler: PublishArticleHandler;
  let articleDomainService: IArticleDomainService;
  let postDomainService: IPostDomainService;
  let contentDomainService: IContentDomainService;
  let contentBinding: IContentBinding;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
        {
          provide: POST_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IPostDomainService>(),
        },
        {
          provide: CONTENT_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IContentDomainService>(),
        },
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<IContentBinding>(),
        },
      ],
    }).compile();
    publishArticleHandler = module.get(PublishArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
    postDomainService = module.get(POST_DOMAIN_SERVICE_TOKEN);
    contentDomainService = module.get(CONTENT_DOMAIN_SERVICE_TOKEN);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const payload = {
      id: v4(),
      actor: userMock,
    };

    it('should execute publish article', async () => {
      jest.spyOn(articleDomainService, 'publish').mockResolvedValueOnce(articleEntityMock);
      jest.spyOn(contentDomainService, 'markSeen').mockResolvedValueOnce();
      jest.spyOn(contentDomainService, 'markReadImportant').mockResolvedValueOnce();
      jest.spyOn(articleEntityMock, 'isImportant').mockReturnValue(true);
      jest.spyOn(articleEntityMock, 'increaseTotalSeen').mockReturnValue();
      jest.spyOn(articleEntityMock, 'setMarkReadImportant').mockReturnValue();

      jest.spyOn(contentBinding, 'articleBinding').mockResolvedValueOnce(articleDtoMock);

      const result = await publishArticleHandler.execute({
        payload,
      });

      expect(articleDomainService.publish).toBeCalledWith(payload);
      expect(contentDomainService.markSeen).toBeCalledWith(
        articleEntityMock.get('id'),
        userMock.id
      );
      expect(articleEntityMock.increaseTotalSeen).toBeCalled();
      expect(contentDomainService.markReadImportant).toBeCalledWith(
        articleEntityMock.get('id'),
        userMock.id
      );
      expect(articleEntityMock.setMarkReadImportant).toBeCalled();
      expect(contentBinding.articleBinding).toBeCalledWith(articleEntityMock, {
        actor: userMock,
        authUser: userMock,
      });
      expect(result).toEqual(articleDtoMock);
    });
  });
});
