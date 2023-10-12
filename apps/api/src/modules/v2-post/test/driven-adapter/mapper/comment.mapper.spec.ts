import { TestBed } from '@automock/jest';
import { CommentAttributes, CommentModel } from '@libs/database/postgres/model';

import { CommentEntity } from '../../../domain/model/comment';
import { CommentMapper } from '../../../driven-adapter/mapper/comment.mapper';
import { createMockCommentEntity, createMockCommentRecord } from '../../mock';

describe('CommentMapper', () => {
  let _commentMapper: CommentMapper;

  let mockCommentRecord: CommentAttributes;
  let mockCommentEntity: CommentEntity;

  beforeEach(async () => {
    const { unit } = TestBed.create(CommentMapper).compile();

    _commentMapper = unit;

    mockCommentRecord = createMockCommentRecord();
    mockCommentEntity = createMockCommentEntity(mockCommentRecord);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('Should map comment model to entity success', async () => {
      const mockCommentModel = {
        ...mockCommentRecord,
        toJSON: () => mockCommentRecord,
      } as CommentModel;

      const commentEntity = _commentMapper.toDomain(mockCommentModel);

      expect(commentEntity).toEqual(mockCommentEntity);
    });

    it('Should return null if comment model is null', async () => {
      const commentEntity = _commentMapper.toDomain(null);

      expect(commentEntity).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('Should map entity to record success', async () => {
      const commentRecord = _commentMapper.toPersistence(mockCommentEntity);

      expect(commentRecord).toEqual(mockCommentRecord);
    });
  });
});
