//FIXME: use @app/redis
import { RedisService } from '../../../../libs/redis/src';
import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { CommentModel } from 'src/database/models/comment.model';
import { PostGroupModel } from 'src/database/models/post-group.model';
import { PostReactionModel } from 'src/database/models/post-reaction.model';
import { IPost, PostModel } from 'src/database/models/post.model';
import { UserService } from 'src/shared/user';
import { UserSharedDto } from 'src/shared/user/dto';
import { CreateReactionService } from '../services';
import {
  mock15ReactionOnAComment,
  mock15ReactionOnAPost,
  mock21ReactionOnAComment,
  mock21ReactionOnAPost,
  mockComment,
  mockCreateReactionDto,
  mockPostCannotReact,
  mockPostCanReact,
  mockPostGroup,
  mockUserDto,
  mockUserSharedDto,
  mockUserSharedDtoNotInTheGroup,
} from './mocks/input.mock';
import { DeleteReactionService } from '../services/delete-reaction.service';

describe('ReactionService', () => {
  let createReactionService: CreateReactionService;
  let deleteReactionService: DeleteReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let postModel: typeof PostModel;
  let commentModel: typeof CommentModel;
  let postGroupModel: typeof PostGroupModel;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReactionService,
        DeleteReactionService,
        {
          provide: RedisService,
          useClass: jest.fn(),
        },
        UserService,
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
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentModel),
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
    deleteReactionService = module.get<DeleteReactionService>(DeleteReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    userService = module.get<UserService>(UserService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    postGroupModel = module.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
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
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        expect(await createReactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(postReactionModelCreateSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
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
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockRejectedValue(new Error('Post is not existed.'));
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
      });
      it('Create post reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 2,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
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
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(0);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
      });
      it('Create post reaction failed because of exceeding reaction kind limit', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 22,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock21ReactionOnAPostData = createMock<PostReactionModel[]>(mock21ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock21ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
      });
      it('Create post reaction failed because of setting canReact to false or isDraft to true', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 22,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCannotReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
      });
      it('Create post reaction failed because user is not in the groups that contain the post.', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const mockPostData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostData);
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDtoNotInTheGroup);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
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
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        expect(await createReactionService.createReaction(mockUserDto, input)).toEqual(true);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of non-existed commentId', async () => {
        const input = mockCreateReactionDto[1];
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockRejectedValue(new Error('commentId is not existed. foreign key constraint'));
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
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
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(0);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
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
        const mock21ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock21ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock21ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because user is not in the group that contain the post having the comment.', async () => {
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
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDtoNotInTheGroup);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not create reaction.');
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
      });
    });
  });

  describe('Delete reaction', () => {
    describe('Delete post reaction', () => {
      it('Delete post reaction successfully', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataFoundOne = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        const postReactionModelDestroySpy = jest
          .spyOn(postReactionModel, 'destroy')
          .mockResolvedValue(1);
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(true);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelDestroySpy).toBeCalledTimes(1);
      });

      it('Delete post reaction failed because of non-existed such reaction', async () => {
        const input = mockCreateReactionDto[0];
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        const postReactionModelDestroySpy = jest
          .spyOn(postReactionModel, 'destroy')
          .mockResolvedValue(1);
        try {
          await deleteReactionService.deleteReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not delete reaction.');
        }
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(postReactionModelDestroySpy).toBeCalledTimes(0);
      });
    });

    describe('Delete comment reaction', () => {
      it('Delete comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataFoundOne = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.userId,
        });
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(mockDataFoundOne);
        const commentReactionModelDestroySpy = jest
          .spyOn(commentReactionModel, 'destroy')
          .mockResolvedValue(1);
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(true);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelDestroySpy).toBeCalledTimes(1);
      });

      it('Delete comment reaction failed because of non-existed such reaction', async () => {
        const input = mockCreateReactionDto[1];
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        const commentReactionModelDestroySpy = jest
          .spyOn(commentReactionModel, 'destroy')
          .mockResolvedValue(1);
        try {
          await deleteReactionService.deleteReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Can not delete reaction.');
        }
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
        expect(commentReactionModelDestroySpy).toBeCalledTimes(0);
      });
    });
  });
});
