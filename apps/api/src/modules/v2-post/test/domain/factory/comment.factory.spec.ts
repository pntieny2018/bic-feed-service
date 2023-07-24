import { CommentFactory } from '../../../domain/factory';
import { Test } from '@nestjs/testing';
import { commentRecord } from '../../mock/comment.model.mock';
import { EventPublisher } from '@nestjs/cqrs';
import { createMock } from '@golevelup/ts-jest';
import { commentEntityMock } from '../../mock/comment.entity.mock';
import { createCommentProps } from '../../mock/comment.props.mock';
import { CommentEntity } from '../../../domain/model/comment';

describe('CommentFactory', function () {
  let commentFactory: CommentFactory;
  let eventPublisher: EventPublisher;

  beforeEach(async function () {
    const module = await Test.createTestingModule({
      providers: [
        CommentFactory,
        {
          provide: EventPublisher,
          useValue: createMock<EventPublisher>(),
        },
      ],
    }).compile();

    commentFactory = module.get<CommentFactory>(CommentFactory);
    eventPublisher = module.get<EventPublisher>(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should return a CommentEntity success', () => {
      const result = commentFactory.createComment({
        userId: commentRecord.createdBy,
        postId: commentRecord.postId,
        content: commentRecord.content,
      });

      expect(result).toBeDefined();
    });
  });

  describe('reconstitute', () => {
    it('should return a CommentEntity success', () => {
      const result = commentFactory.reconstitute({
        id: commentRecord.id,
        postId: commentRecord.postId,
        createdBy: commentRecord.createdBy,
        updatedBy: commentRecord.updatedBy,
      });

      expect(result).toBeDefined();
    });
  });
});
