import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';

import { DatabaseException } from '../../../../../common/exceptions/database.exception';
import { LinkPreviewDto } from '../../../application/dto';
import { ILinkPreviewDomainService } from '../../../domain/domain-service/interface/link-preview.domain-service.interface';
import { LinkPreviewDomainService } from '../../../domain/domain-service/link-preview.domain-service';
import {
  ILinkPreviewFactory,
  LINK_PREVIEW_FACTORY_TOKEN,
} from '../../../domain/factory/interface/link-preview.factory.interface';
import { LinkPreviewFactory } from '../../../domain/factory/link-preview.factory';
import {
  ILinkPreviewRepository,
  LINK_PREVIEW_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { LinkPreviewRepository } from '../../../driven-adapter/repository/link-preview.repository';
import { createMockLinkPreviewEntity } from '../../mock/link-preview.mock';

const mockLinkPreviewEntity = createMockLinkPreviewEntity();

describe('LinkPreviewDomainService', () => {
  let linkPreviewDomainService: ILinkPreviewDomainService;
  let repo: ILinkPreviewRepository;
  let factory: ILinkPreviewFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkPreviewDomainService,
        {
          provide: LINK_PREVIEW_FACTORY_TOKEN,
          useValue: createMock<LinkPreviewFactory>(),
        },
        {
          provide: LINK_PREVIEW_REPOSITORY_TOKEN,
          useValue: createMock<LinkPreviewRepository>(),
        },
      ],
    }).compile();

    linkPreviewDomainService = module.get<LinkPreviewDomainService>(LinkPreviewDomainService);
    repo = module.get(LINK_PREVIEW_REPOSITORY_TOKEN);
    factory = module.get(LINK_PREVIEW_FACTORY_TOKEN);
    jest.spyOn(I18nContext, 'current').mockImplementation(
      () =>
        ({
          t: (...args) => {},
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrUpsert', () => {
    it('should return link preview if found', async () => {
      jest.spyOn(repo, 'findByUrl').mockResolvedValue(mockLinkPreviewEntity);
      const result = await linkPreviewDomainService.findOrUpsert({
        url: mockLinkPreviewEntity.get('url'),
      } as LinkPreviewDto);

      expect(result).toEqual(mockLinkPreviewEntity);
    });

    it('should return link preview if create', async () => {
      jest.spyOn(repo, 'findByUrl').mockResolvedValue(null);
      await linkPreviewDomainService.findOrUpsert({
        url: mockLinkPreviewEntity.get('url'),
      } as LinkPreviewDto);

      expect(factory.createLinkPreview).toBeCalledWith({
        url: mockLinkPreviewEntity.get('url'),
      });
    });

    it("should return null if don't have url", async () => {
      const res = await linkPreviewDomainService.findOrUpsert({} as LinkPreviewDto);
      expect(res).toBeNull();
    });

    it('should throw DatabaseException', async () => {
      jest.spyOn(repo, 'findByUrl').mockImplementation(() => Promise.reject(new Error()));
      jest.spyOn(linkPreviewDomainService['_logger'], 'error').mockImplementation(() => {});

      await expect(
        linkPreviewDomainService.findOrUpsert({
          url: '1',
        } as LinkPreviewDto)
      ).rejects.toThrow(new DatabaseException());

      expect(linkPreviewDomainService['_logger'].error).toBeCalledTimes(1);
    });
  });
});
