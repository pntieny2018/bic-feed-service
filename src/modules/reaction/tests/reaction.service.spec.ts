import { RedisService } from '@app/redis';
import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../shared/user';
import { CreateReactionService } from '../services';
import {
  mock15ReactionOnAComment,
  mock15ReactionOnAPost,
  mock21ReactionOnAComment,
  mock21ReactionOnAPost,
  mockComment,
  mockCommentReactionModelFindOne,
  mockCommentSmileReaction,
  mockCreateReactionDto,
  mockDeleteReactionDto,
  mockGetReactionDto,
  mockPostCannotReact,
  mockPostCanReact,
  mockPostGroup,
  mockPostReactionModelFindOne,
  mockPostSmileReaction,
  mockReactionDto,
  mockUserDto,
  mockUserSharedDto,
  mockUserSharedDtoNotInTheGroup,
} from './mocks/input.mock';
import { DeleteReactionService } from '../services';
import { PostModel } from '../../../database/models/post.model';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { UserSharedDto } from '../../../shared/user/dto';
import { GroupService } from '../../../shared/group';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { ReactionDto } from '../dto/reaction.dto';
import { CommonReactionService } from '../services';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { NotificationModule, NotificationService } from '../../../notification';
import { ReactionEnum } from '../reaction.enum';
import { Sequelize } from 'sequelize-typescript';
import { ConfigModule } from '@nestjs/config';
import { ReactionResponseDto } from '../dto/response';
import { LogicException } from '../../../common/exceptions';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';

describe('ReactionService', () => {
  let createReactionService: CreateReactionService;
  let deleteReactionService: DeleteReactionService;
  let commentReactionModel: typeof CommentReactionModel;
  let postReactionModel: typeof PostReactionModel;
  let postModel: typeof PostModel;
  let commentModel: typeof CommentModel;
  let postGroupModel: typeof PostGroupModel;
  let userService: UserService;
  let groupService: GroupService;
  let commonReactionService: CommonReactionService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        UserService,
        GroupService,
        CommonReactionService,
        CreateReactionService,
        DeleteReactionService,
        {
          provide: RedisService,
          useClass: jest.fn(),
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            publishReactionNotification: jest.fn(),
          },
        },
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
        {
          provide: Sequelize,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(async () => ({
              commit: jest.fn(),
              rollback: jest.fn(),
            })),
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
    groupService = module.get<GroupService>(GroupService);
    commonReactionService = module.get<CommonReactionService>(CommonReactionService);
    commentReactionModel = module.get<typeof CommentReactionModel>(
      getModelToken(CommentReactionModel)
    );
    postReactionModel = module.get<typeof PostReactionModel>(getModelToken(PostReactionModel));
    postModel = module.get<typeof PostModel>(getModelToken(PostModel));
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    postGroupModel = module.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    notificationService = module.get<NotificationService>(NotificationService);
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
          createdBy: mockUserDto.id,
          createdAt: new Date('0'),
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        commonReactionService.createCreateReactionEvent = jest.fn().mockResolvedValue('ok!');
        const response = {
          id: mockDataCreated.id,
          reactionName: mockDataCreated.reactionName,
          actor: null,
          createdAt: mockDataCreated.createdAt,
        };
        const x = await createReactionService.createReaction(mockUserDto, input);
        x.actor = null;
        expect(x).toEqual(response);
        expect(postReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
        expect(commonReactionService.createCreateReactionEvent).toBeCalledTimes(1);
      });

      it('Create post reaction successfully - react on existed reaction kind of the post.', async () => {
        const input = {
          reactionName: mock15ReactionOnAPost[0].reactionName,
          target: ReactionEnum.POST,
          targetId: mock15ReactionOnAPost[0].postId,
        };
        const mockDataCreated = createMock<PostReactionModel>(mock15ReactionOnAPost[0]);
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        commonReactionService.createCreateReactionEvent = jest.fn().mockResolvedValue('ok!');
        const response = {
          id: mockDataCreated.id,
          reactionName: mockDataCreated.reactionName,
          actor: null,
          createdAt: mockDataCreated.createdAt,
        };
        const x = await createReactionService.createReaction(mockUserDto, input);
        x.actor = null;
        expect(x).toEqual(response);
        expect(postReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because of not match reaction type', async () => {
        const mockWrongTargetCreateReactionDto = {
          ...mockCreateReactionDto[0],
          target: 'POSTS' as ReactionEnum,
        };
        try {
          await createReactionService.createReaction(mockUserDto, mockWrongTargetCreateReactionDto);
        } catch (e) {
          expect(e.message).toEqual('Reaction type not match.');
        }
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockRejectedValue(new Error('Such post is not existed.'));
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toBe('Such post is not existed.');
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });

      it('Create post reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 2,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(true);
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
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new LogicException('Reaction is existed.'));
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(0);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });

      it('Create post reaction failed because of non-permit reacting post', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const postReactionModelCreateSpy = jest
          .spyOn(postReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnAPostData = createMock<PostReactionModel[]>(mock15ReactionOnAPost);
        const postReactionModelFindAllSpy = jest
          .spyOn(postReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnAPostData);
        const postModelFindOneSpy = jest.spyOn(postModel, 'findOne').mockResolvedValue(null);
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        const response = {
          ...input,
          userId: mockUserDto.id,
        } as ReactionDto;
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new LogicException('Post does not permit to react.'));
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });

      it('Create post reaction failed because of exceeding reaction kind limit', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 22,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new LogicException('Exceed reaction kind limit on a post.'));
        }
        expect(postReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because user is not in the groups that contain the post.', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDtoNotInTheGroup);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(false);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new ForbiddenException("User is not in the post's groups"));
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
      });

      it('Create post reaction failed because can not get user data on cache so can not check whether user is in the group', async () => {
        const input = mockCreateReactionDto[0];
        const mockDataCreated = createMock<PostReactionModel>({
          id: 1,
          postId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
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
        const commonReactionIsExistedPostReaction = jest
          .spyOn(commonReactionService, 'isExistedPostReaction')
          .mockResolvedValue(false);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const userServiceGetSpy = jest.spyOn(userService, 'get').mockResolvedValue(null);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        const response = {
          ...input,
          userId: mockUserDto.id,
        } as ReactionDto;
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(
            new InternalServerErrorException(
              'Can not get data of user on cache. Unable to check whether user is in the group.'
            )
          );
        }
        expect(postReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedPostReaction).toBeCalledTimes(1);
        expect(postReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(postModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });
    });

    describe('Create comment reaction', () => {
      it('Create comment reaction successfully', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
          createdAt: new Date('0'),
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commonReactionIsExistedCommentReaction = jest
          .spyOn(commonReactionService, 'isExistedCommentReaction')
          .mockResolvedValue(false);
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
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        commonReactionService.createCreateReactionEvent = jest.fn().mockResolvedValue('ok!');
        const response = {
          id: mockDataCreated.id,
          reactionName: mockDataCreated.reactionName,
          actor: null,
          createdAt: mockDataCreated.createdAt,
        } as ReactionResponseDto;
        const x = await createReactionService.createReaction(mockUserDto, input);
        x.actor = null;
        expect(x).toEqual(response);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(1);
        expect(commonReactionIsExistedCommentReaction).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
      });

      it('Create comment reaction failed because of non-existed comment', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commonReactionIsExistedCommentReaction = jest
          .spyOn(commonReactionService, 'isExistedCommentReaction')
          .mockResolvedValue(false);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest.spyOn(commentModel, 'findOne').mockResolvedValue(null);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {}
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedCommentReaction).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });

      it('Create comment reaction failed because of existed reaction', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 2,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const commonReactionIsExistedCommentReaction = jest
          .spyOn(commonReactionService, 'isExistedCommentReaction')
          .mockResolvedValue(true);
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
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new LogicException('Reaction is existed.'));
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedCommentReaction).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(0);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(0);
        expect(userServiceGetSpy).toBeCalledTimes(0);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(0);
      });

      it('Create comment reaction failed because of exceeding reaction kind limit', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 22,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock21ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock21ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock21ReactionOnACommentData);
        const commonReactionIsExistedCommentReaction = jest
          .spyOn(commonReactionService, 'isExistedCommentReaction')
          .mockResolvedValue(false);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostModelFindOneData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostModelFindOneData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDto);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(true);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new LogicException('Exceed reaction kind limit on a comment.'));
        }
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(1);
        expect(commonReactionIsExistedCommentReaction).toBeCalledTimes(1);
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(0);
      });

      it('Create comment reaction failed because user is not in the group that contain the post having the comment.', async () => {
        const input = mockCreateReactionDto[1];
        const mockDataCreated = createMock<CommentReactionModel>({
          id: 1,
          commentId: input.targetId,
          reactionName: input.reactionName,
          createdBy: mockUserDto.id,
        });
        const commentReactionModelCreateSpy = jest
          .spyOn(commentReactionModel, 'create')
          .mockResolvedValue(mockDataCreated);
        const mock15ReactionOnACommentData =
          createMock<CommentReactionModel[]>(mock15ReactionOnAComment);
        const commentReactionModelFindAllSpy = jest
          .spyOn(commentReactionModel, 'findAll')
          .mockResolvedValue(mock15ReactionOnACommentData);
        const commonReactionIsExistedCommentReaction = jest
          .spyOn(commonReactionService, 'isExistedCommentReaction')
          .mockResolvedValue(false);
        const mockCommentData = createMock<CommentModel>(mockComment);
        const commentModelFindOneSpy = jest
          .spyOn(commentModel, 'findOne')
          .mockResolvedValue(mockCommentData);
        const mockPostModelFindOneData = createMock<PostModel>(mockPostCanReact);
        const postModelFindOneSpy = jest
          .spyOn(postModel, 'findOne')
          .mockResolvedValue(mockPostModelFindOneData);
        const mockPostGroupData = createMock<PostGroupModel[]>(mockPostGroup);
        const postGroupModelFindAllSpy = jest
          .spyOn(postGroupModel, 'findAll')
          .mockResolvedValue(mockPostGroupData);
        const mockUserSharedDtoData = createMock<UserSharedDto>(mockUserSharedDtoNotInTheGroup);
        const userServiceGetSpy = jest
          .spyOn(userService, 'get')
          .mockResolvedValue(mockUserSharedDtoData);
        const groupServiceIsMemberOfSomeGroupsSpy = jest
          .spyOn(groupService, 'isMemberOfSomeGroups')
          .mockReturnValue(false);
        try {
          await createReactionService.createReaction(mockUserDto, input);
        } catch (e) {
          expect(e).toEqual(new ForbiddenException("User is not in the post's groups."));
        }
        expect(commentReactionModelCreateSpy).toBeCalledTimes(0);
        expect(commonReactionIsExistedCommentReaction).toBeCalledTimes(1);
        expect(commentReactionModelFindAllSpy).toBeCalledTimes(0);
        expect(commentModelFindOneSpy).toBeCalledTimes(1);
        expect(postGroupModelFindAllSpy).toBeCalledTimes(1);
        expect(userServiceGetSpy).toBeCalledTimes(1);
        expect(groupServiceIsMemberOfSomeGroupsSpy).toBeCalledTimes(1);
        expect(postModelFindOneSpy).toBeCalledTimes(0);
      });
    });
  });

  describe('Delete reaction', () => {
    describe('Delete post reaction', () => {
      it('Delete post reaction successfully', async () => {
        const input = mockDeleteReactionDto[0];
        const mockmockPostReactionModelFindOne = createMock<PostReactionModel>(
          mockPostReactionModelFindOne as PostReactionModel
        );
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockmockPostReactionModelFindOne);
        jest.spyOn(commonReactionService, 'createDeleteReactionEvent').mockResolvedValue();
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(true);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Delete post reaction failed because of reaction type not match. "POSTS"', async () => {
        const input = {
          ...mockDeleteReactionDto[0],
          target: 'POSTS' as ReactionEnum,
        };
        const mockmockPostReactionModelFindOne = createMock<PostReactionModel>(
          mockPostReactionModelFindOne as PostReactionModel
        );
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(mockmockPostReactionModelFindOne);
        try {
          await deleteReactionService.deleteReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Reaction type not match.');
        }
        expect(postReactionModelFindOneSpy).toBeCalledTimes(0);
      });

      it('Delete post reaction failed because of non-existed such reaction', async () => {
        const input = mockDeleteReactionDto[0];
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        try {
          await deleteReactionService.deleteReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not delete reaction.');
        }
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Delete post reaction failed because of not a reaction of user', async () => {
        const input = mockDeleteReactionDto[0];
        const postReactionModelFindOneSpy = jest
          .spyOn(postReactionModel, 'findOne')
          .mockResolvedValue(null);
        commonReactionService.createDeleteReactionEvent = jest.fn().mockResolvedValue('ok!');
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(false);
        expect(postReactionModelFindOneSpy).toBeCalledTimes(1);
      });
    });

    describe('Delete comment reaction', () => {
      it('Delete comment reaction successfully', async () => {
        const input = mockDeleteReactionDto[1];
        const mockmockCommentReactionModelFindOne = createMock<CommentReactionModel>(
          mockCommentReactionModelFindOne as CommentReactionModel
        );
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(mockmockCommentReactionModelFindOne);
        jest.spyOn(commonReactionService, 'createDeleteReactionEvent').mockResolvedValue();
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(true);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Delete comment reaction failed because of non-existed such reaction', async () => {
        const input = mockDeleteReactionDto[1];
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        try {
          await deleteReactionService.deleteReaction(mockUserDto, input);
        } catch (e) {
          expect(e.message).toEqual('Can not delete reaction.');
        }
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });

      it('Delete comment reaction failed because of not a reaction of user', async () => {
        const input = mockDeleteReactionDto[1];
        const commentReactionModelFindOneSpy = jest
          .spyOn(commentReactionModel, 'findOne')
          .mockResolvedValue(null);
        expect(await deleteReactionService.deleteReaction(mockUserDto, input)).toEqual(false);
        expect(commentReactionModelFindOneSpy).toBeCalledTimes(1);
      });
    });
  });

  describe('Common reaction', () => {
    it('Return true if post reaction is existed', async () => {
      const mockPostReactionModelFindOneData = createMock<PostReactionModel>(
        mockPostReactionModelFindOne
      );
      const spyPostReactionModelFindOne = jest
        .spyOn(postReactionModel, 'findOne')
        .mockResolvedValue(mockPostReactionModelFindOneData);
      const value = await commonReactionService.isExistedPostReaction(
        mockUserDto.id,
        mockCreateReactionDto[0]
      );
      expect(value).toEqual(true);
      expect(spyPostReactionModelFindOne).toBeCalledTimes(1);
    });

    it('Return true if comment reaction is existed', async () => {
      const mockCommentReactionModelFindOneData = createMock<CommentReactionModel>(
        mockCommentReactionModelFindOne
      );
      const spyCommentReactionModelFindOne = jest
        .spyOn(commentReactionModel, 'findOne')
        .mockResolvedValue(mockCommentReactionModelFindOneData);
      const value = await commonReactionService.isExistedCommentReaction(
        mockUserDto.id,
        mockCreateReactionDto[0]
      );
      expect(value).toEqual(true);
      expect(spyCommentReactionModelFindOne).toBeCalledTimes(1);
    });

    it('createCreateReactionEvent', async () => {
      const post = {
        toJSON: () => mockPostReactionModelFindOne,
      };
      postModel.findOne = jest.fn().mockResolvedValue(post);
      await commonReactionService.createCreateReactionEvent(
        mockUserSharedDto,
        mockReactionDto,
        mockPostReactionModelFindOne.id
      );
      expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
    });

    it('createDeleteReactionEvent', async () => {
      const post = {
        toJSON: () => mockPostReactionModelFindOne,
      };
      commonReactionService.getPost = jest.fn().mockResolvedValue(post);
      userService.get = jest.fn().mockResolvedValue(mockUserSharedDto);
      await commonReactionService.createDeleteReactionEvent(
        mockUserDto,
        mockReactionDto,
        mockPostReactionModelFindOne.id
      );
      expect(notificationService.publishReactionNotification).toBeCalledTimes(1);
    });

    it('getReactions of Post', async () => {
      postReactionModel.findAll = jest.fn().mockResolvedValue(mockPostSmileReaction);
      userService.getMany = jest.fn().mockResolvedValue([mockUserSharedDto]);
      const res = await commonReactionService.getReactions(mockGetReactionDto);
      expect(postReactionModel.findAll).toBeCalledTimes(1);
      expect(userService.getMany).toBeCalledTimes(1);
    });

    it('getReactions of Comment', async () => {
      commentReactionModel.findAll = jest.fn().mockResolvedValue(mockCommentSmileReaction);
      userService.getMany = jest.fn().mockResolvedValue([mockUserSharedDto]);
      const res = await commonReactionService.getReactions({
        ...mockGetReactionDto,
        target: ReactionEnum.COMMENT,
      });
      expect(commentReactionModel.findAll).toBeCalledTimes(1);
      expect(userService.getMany).toBeCalledTimes(1);
    });
  });
});
