import { createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { REACTION_SERVICE } from '../reaction.constants';
import { ReactionService } from '../reaction.service';
import { mockCreateReactionDto, mockUserInfoDto } from './mocks/input.mock';

describe('ReactionService', () => {
  let reactionService: ReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionService,
        {
          provide: getModelToken(PostReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentReactionModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: REACTION_SERVICE,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    reactionService = module.get<ReactionService>(ReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(getModelToken(CommentReactionModel));
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create reaction', () => {
    describe('Create post reaction', () => {
      it('Create post reaction successfully', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });

        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);

        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);

        expect(await reactionService.handleReaction(mockUserInfoDto, input, true)).toEqual(true);
        expect(await reactionService.handlePostReaction(mockUserInfoDto.userId, input, true)).toEqual(true);
        expect(postReactionModelCreateSpy).toBeCalledTimes(2);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(2);
      });

      it('Create post reaction failed because of non-existed postId', async () => {
        const input = mockCreateReactionDto[0];
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockRejectedValue(new Error('postId is not existed'));
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await reactionService.handleReaction(mockUserInfoDto, input, true);
        } catch (e) {
          expect(e.message).toBe('postId is not existed');
        }
        try {
          await reactionService.handlePostReaction(mockUserInfoDto.userId, input, true);
        } catch (e) {
          expect(e.message).toBe('postId is not existed');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(2);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(2);
      });

      it('Create post reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 2,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });
        const mockDataFoundOne = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);

        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);

        try {
          await reactionService.handleReaction(mockUserInfoDto, input, true);
        } catch (e) {
          expect(e.message).toBe('Reaction existence is true');
        }
        try {
          await reactionService.handlePostReaction(mockUserInfoDto.userId, input, true);
        } catch (e) {
          expect(e.message).toBe('Reaction existence is true');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(2);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });

        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);

        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);

        expect(await reactionService.handleReaction(mockUserInfoDto, input, true)).toEqual(true);
        expect(await reactionService.handleCommentReaction(mockUserInfoDto.userId, input, true)).toEqual(true);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(2);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(2);
      });

      it('Create comment reaction failed because of non-existed commentId', async () => {
        const input = mockCreateReactionDto[1];
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockRejectedValue(new Error('commentId is not existed'));
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await reactionService.handleReaction(mockUserInfoDto, input, true);
        } catch (e) {
          expect(e.message).toBe('commentId is not existed');
        }
        try {
          await reactionService.handleCommentReaction(mockUserInfoDto.userId, input, true);
        } catch (e) {
          expect(e.message).toBe('commentId is not existed');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(2);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(2);
      });

      it('Create comment reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 2,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });
        const mockDataFoundOne = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: input.createdBy,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);

        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);

        try {
          await reactionService.handleReaction(mockUserInfoDto, input, true);
        } catch (e) {
          expect(e.message).toBe('Reaction existence is true');
        }
        try {
          await reactionService.handleCommentReaction(mockUserInfoDto.userId, input, true);
        } catch (e) {
          expect(e.message).toBe('Reaction existence is true');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(2);
      });
    });
  });
});
