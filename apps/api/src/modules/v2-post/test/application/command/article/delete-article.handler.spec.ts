import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { v4 } from 'uuid';

import { DeleteArticleHandler } from '../../../../application/command/article';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException } from '../../../../domain/exception';
import { userMock } from '../../../mock/user.dto.mock';

describe('DeleteArticleHandler', () => {
  let handler: DeleteArticleHandler;
  let articleDomainService: IArticleDomainService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteArticleHandler,
        {
          provide: ARTICLE_DOMAIN_SERVICE_TOKEN,
          useValue: createMock<IArticleDomainService>(),
        },
      ],
    }).compile();
    handler = module.get(DeleteArticleHandler);
    articleDomainService = module.get(ARTICLE_DOMAIN_SERVICE_TOKEN);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const id = v4();
    it('should execute delete article', async () => {
      jest.spyOn(articleDomainService, 'deleteArticle').mockResolvedValueOnce();
      await handler.execute({
        payload: {
          id,
          actor: userMock,
        },
      });
      expect(articleDomainService.deleteArticle).toBeCalledWith({ id, actor: userMock });
    });

    it('should throw error when article not found', async () => {
      jest
        .spyOn(articleDomainService, 'deleteArticle')
        .mockRejectedValueOnce(new ContentNotFoundException());

      await expect(
        handler.execute({
          payload: {
            id,
            actor: userMock,
          },
        })
      ).rejects.toThrowError();
    });
  });
});
