import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { IPost, PostModel } from 'src/database/models/post.model';
import { CreateReactionService } from '../services';
import {
  mock15ReactionOnAComment,
  mock15ReactionOnAPost,
  mock21ReactionOnAComment,
  mock21ReactionOnAPost,
  mockCreateReactionDto,
  mockPostCannotReact,
  mockPostCanReact,
  mockUserDto,
} from './mocks/input.mock';

describe('ReactionService', () => {
  let createReactionService: CreateReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let postModel: typeof PostModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReactionService,
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
          provide: getModelToken(PostModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    createReactionService = module.get<CreateReactionService>(CreateReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(getModelToken(CommentReactionModel));
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
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
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        expect(await createReactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(postReactionModelCreateSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because of non-existed postId', async () => {
        const input = mockCreateReactionDto[0];
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockRejectedValue(new Error('postId is not existed. foreign key constraint'));
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockRejectedValue(new Error('Post is not existed.'));
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 2,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockDataFoundOne = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(0);
      });

      it('Create post reaction failed because of exceeding reaction kind limit', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 22,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
        const mock21ReactionOnAPostData = createMock<PostReactionModel[]>(mock21ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock21ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because of setting canReact to false', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 22,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest.spyOn(postReactionModel, 'create').mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCannotReact);
        const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest.spyOn(postReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnACommentData = createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        expect(await createReactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of non-existed commentId', async () => {
        const input = mockCreateReactionDto[1];
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockRejectedValue(new Error('commentId is not existed. foreign key constraint'));
        const mock15ReactionOnACommentData = createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 2,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mockDataFoundOne = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        const mock15ReactionOnACommentData = createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
      });

      it('Create comment reaction failed because of exceeding reaction kind limit', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 22,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock21ReactionOnACommentData = createMock<CommentReactionModel[]>(mock21ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock21ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest.spyOn(commentReactionModel, 'findOne').mockResolvedValue(null);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
      });
    });
  });
});
