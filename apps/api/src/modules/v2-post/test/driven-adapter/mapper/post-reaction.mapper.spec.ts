import { TestBed } from '@automock/jest';
import { PostReactionAttributes, PostReactionModel } from '@libs/database/postgres/model';

import { ReactionEntity } from '../../../domain/model/reaction';
import { PostReactionMapper } from '../../../driven-adapter/mapper/post-reaction.mapper';
import { createMockPostReactionEntity, createMockPostReactionRecord } from '../../mock';

describe('PostReactionMapper', () => {
  let _postReactionMapper: PostReactionMapper;

  let mockPostReactionRecord: PostReactionAttributes;
  let mockReactionEntity: ReactionEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(PostReactionMapper).compile();

    _postReactionMapper = unit;

    mockPostReactionRecord = createMockPostReactionRecord();
    mockReactionEntity = createMockPostReactionEntity(mockPostReactionRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map comment reaction model to entity success', async () => {
      const mockPostReactionModel = {
        ...mockPostReactionRecord,
        toJSON: () => mockPostReactionRecord,
      } as PostReactionModel;

      const reactionEntity = _postReactionMapper.toDomain(mockPostReactionModel);

      expect(reactionEntity).toEqual(mockReactionEntity);
    });

    it('Should return null if comment reaction model is null', async () => {
      const reactionEntity = _postReactionMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map reaction entity to record success', async () => {
      const postReactionRecord = _postReactionMapper.toPersistence(mockReactionEntity);

      expect(postReactionRecord).toEqual(mockPostReactionRecord);
    });
  });
});
