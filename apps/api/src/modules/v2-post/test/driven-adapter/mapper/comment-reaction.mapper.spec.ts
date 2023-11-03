import { TestBed } from '@automock/jest';
import { CommentReactionAttributes, CommentReactionModel } from '@libs/database/postgres/model';

import { ReactionEntity } from '../../../domain/model/reaction';
import { CommentReactionMapper } from '../../../driven-adapter/mapper/comment-reaction.mapper';
import { createMockCommentReactionEntity, createMockCommentReactionRecord } from '../../mock';

describe('CommentReactionMapper', () => {
  let _commentReactionMapper: CommentReactionMapper;

  let mockCommentReactionRecord: CommentReactionAttributes;
  let mockReactionEntity: ReactionEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(CommentReactionMapper).compile();

    _commentReactionMapper = unit;

    mockCommentReactionRecord = createMockCommentReactionRecord();
    mockReactionEntity = createMockCommentReactionEntity(mockCommentReactionRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map comment reaction model to entity success', async () => {
      const mockCommentReactionModel = {
        ...mockCommentReactionRecord,
        toJSON: () => mockCommentReactionRecord,
      } as CommentReactionModel;

      const reactionEntity = _commentReactionMapper.toDomain(mockCommentReactionModel);

      expect(reactionEntity).toEqual(mockReactionEntity);
    });

    it('Should return null if comment reaction model is null', async () => {
      const reactionEntity = _commentReactionMapper.toDomain(null);

      expect(reactionEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map reaction entity to record success', async () => {
      const commentReactionRecord = _commentReactionMapper.toPersistence(mockReactionEntity);

      expect(commentReactionRecord).toEqual(mockCommentReactionRecord);
    });
  });
});
