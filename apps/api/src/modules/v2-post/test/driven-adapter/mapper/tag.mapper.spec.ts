import { TestBed } from '@automock/jest';
import { TagAttributes, TagModel } from '@libs/database/postgres/model';

import { TagEntity } from '../../../domain/model/tag';
import { TagMapper } from '../../../driven-adapter/mapper/tag.mapper';
import { createMockTagEntity, createMockTagRecord } from '../../mock';

describe('TagMapper', () => {
  let _tagMapper: TagMapper;

  let mockTagRecord: TagAttributes;
  let mockTagEntity: TagEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(TagMapper).compile();

    _tagMapper = unit;

    mockTagRecord = createMockTagRecord();
    mockTagEntity = createMockTagEntity(mockTagRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map tag model to entity success', async () => {
      const mockTagModel = {
        ...mockTagRecord,
        toJSON: () => mockTagRecord,
      } as TagModel;

      const tagEntity = _tagMapper.toDomain(mockTagModel);

      expect(tagEntity).toEqual(mockTagEntity);
    });

    it('Should return null if tag model is null', async () => {
      const tagEntity = _tagMapper.toDomain(null);

      expect(tagEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map tag entity to record success', async () => {
      const tagRecord = _tagMapper.toPersistence(mockTagEntity);

      expect(tagRecord).toEqual(mockTagRecord);
    });
  });
});
