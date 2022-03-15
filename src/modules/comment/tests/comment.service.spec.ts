import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from '../comment.service';

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentService],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CommentService.create', () => {
    describe('Create comment with post not existed', () => {
      it('should throw exception', () => {});
    });

    describe('Create comment with parent comment id not existed', () => {
      it('should throw exception', () => {});
    });

    describe('Create comment with parent comment id is child comment id', () => {
      it('should throw exception', () => {});
    });

    describe('Create comment with invalid mentions', () => {
      describe('user not in group audience', () => {});
      describe('user not exist', () => {});
    });

    describe('Create comment with invalid media', () => {
      describe('media not exist', () => {});
      describe('is not owner of media', () => {});
    });
  });
});
