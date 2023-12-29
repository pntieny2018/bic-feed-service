import { TestBed } from '@automock/jest';
import { ORDER } from '@beincom/constants';

import { ContentDomainService } from '../../../domain/domain-service/content.domain-service';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { MockClass } from '../../mock';
import { createMockArticleEntity, createMockPostEntity } from '../../mock/content.mock';
import { createMockUserDto } from '../../mock/user.mock';

const postEntityMock = createMockPostEntity();
const articleEntityMock = createMockArticleEntity();
const userMock = createMockUserDto();

describe('ContentDomainService', () => {
  let contentDomainService: ContentDomainService;
  let contentRepository: MockClass<IContentRepository>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ContentDomainService).compile();

    contentDomainService = unit;
    contentRepository = unitRef.get(CONTENT_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduleContentIds', () => {
    it('should get schedule contentIds', async () => {
      jest
        .spyOn(contentRepository, 'getCursorPagination')
        .mockResolvedValueOnce({ rows: [articleEntityMock], meta: {} });

      const result = await contentDomainService.getScheduleContentIds({
        userId: userMock.id,
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
