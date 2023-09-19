import { ORDER } from '@beincom/constants';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { ContentDomainService } from '../../../domain/domain-service/content.domain-service';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { articleEntityMock } from '../../mock/article.entity.mock';
import { postEntityMock } from '../../mock/post.entity.mock';
import { userMock } from '../../mock/user.dto.mock';

describe('ContentDomainService', () => {
  let contentDomainService: ContentDomainService;
  let contentRepository: IContentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentDomainService,
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useValue: createMock<IContentRepository>(),
        },
      ],
    }).compile();

    contentDomainService = module.get<ContentDomainService>(ContentDomainService);
    contentRepository = module.get<IContentRepository>(CONTENT_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduleContentIds', () => {
    it('should get schedule contentIds', async () => {
      jest
        .spyOn(contentRepository, 'getPagination')
        .mockResolvedValueOnce({ rows: [articleEntityMock], meta: {} });

      const result = await contentDomainService.getScheduleContentIds({
        user: userMock,
        limit: 10,
        order: ORDER.ASC,
      });
      expect(result.rows).toEqual([articleEntityMock.get('id')]);
    });
  });

  describe('getContentByIds', () => {
    it('should get content by ids', async () => {
      jest
        .spyOn(contentRepository, 'findAll')
        .mockResolvedValueOnce([articleEntityMock, postEntityMock]);

      const result = await contentDomainService.getContentByIds({
        ids: [postEntityMock.getId(), articleEntityMock.get('id')],
        authUserId: userMock.id,
      });
      expect(result).toEqual([postEntityMock, articleEntityMock]);
    });
  });
});
