import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { ContentBinding } from '../../../../application/binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../../application/binding/binding-post/content.interface';
import {
  UpdateArticleCommand,
  UpdateArticleHandler,
} from '../../../../application/command/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { articleDtoMock, articleEntityMock } from '../../../mock/article.entity.mock';
import { userMock } from '../../../mock/user.dto.mock';

describe('UpdateArticleHandler', () => {
  let handler: UpdateArticleHandler;
  let contentBinding: ContentBinding;
  let articleDomainService: IArticleDomainService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateArticleHandler,
        {
          provide: CONTENT_BINDING_TOKEN,
          useValue: createMock<ContentBinding>(),
        },
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
      ],
    }).compile();
    handler = module.get(UpdateArticleHandler);
    contentBinding = module.get(CONTENT_BINDING_TOKEN);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return an article dto', async () => {
      const command: UpdateArticleCommand = {
        payload: {
          actor: userMock,
          id: '1',
        },
      };

      jest.spyOn(articleDomainService, 'update').mockResolvedValue(articleEntityMock);
      jest.spyOn(contentBinding, 'articleBinding').mockResolvedValue(articleDtoMock);

      const result = await handler.execute(command);
      expect(articleDomainService.update).toBeCalledWith(command.payload);
      expect(result).toEqual(articleDtoMock);
    });
  });
});
