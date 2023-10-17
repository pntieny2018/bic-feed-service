import { TestBed } from '@automock/jest';
import { LinkPreviewAttributes, LinkPreviewModel } from '@libs/database/postgres/model';

import { LinkPreviewEntity } from '../../../domain/model/link-preview';
import { LinkPreviewMapper } from '../../../driven-adapter/mapper/link-preview.mapper';
import { createMockLinkPreviewEntity, createMockLinkPreviewRecord } from '../../mock';

describe('LinkPreviewMapper', () => {
  let _linkPreviewMapper: LinkPreviewMapper;

  let mockLinkPreviewRecord: LinkPreviewAttributes;
  let mockLinkPreviewEntity: LinkPreviewEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(LinkPreviewMapper).compile();

    _linkPreviewMapper = unit;

    mockLinkPreviewRecord = createMockLinkPreviewRecord();
    mockLinkPreviewEntity = createMockLinkPreviewEntity(mockLinkPreviewRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map link preview model to entity success', async () => {
      const mockLinkPreviewModel = {
        ...mockLinkPreviewRecord,
        toJSON: () => mockLinkPreviewRecord,
      } as LinkPreviewModel;

      const linkPreviewEntity = _linkPreviewMapper.toDomain(mockLinkPreviewModel);

      expect(linkPreviewEntity).toEqual(mockLinkPreviewEntity);
    });

    it('Should return null if link preview model is null', async () => {
      const reactionEntity = _linkPreviewMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map link preview entity to record success', async () => {
      const linkPreviewRecord = _linkPreviewMapper.toPersistence(mockLinkPreviewEntity);

      expect(linkPreviewRecord).toEqual(mockLinkPreviewRecord);
    });
  });
});
