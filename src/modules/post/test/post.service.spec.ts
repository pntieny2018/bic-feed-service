import { DeletedPostEvent, UpdatedPostEvent } from '../../../events/post';
import { MentionableType } from '../../../common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { mockedPostList, mockedCreatePostDto, mockedUpdatePostDto } from './mocks/post-list.mock';
import { mockedUserAuth } from './mocks/user-auth.mock';
import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
``;
import { Sequelize } from 'sequelize-typescript';
import { MediaService } from '../../media';
import { MentionService } from '../../mention';
import { Transaction } from 'sequelize';
import { CreatedPostEvent } from '../../../events/post';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PublishedPostEvent } from '../../../events/post';
import { MentionModel } from '../../../database/models/mention.model';
import { EntityIdDto } from '../../../common/dto';

describe('PostService', () => {
  let postService: PostService;
  let postModelMock;
  let postGroupModelMock;
  let sentryService: SentryService;
  let eventEmitter: EventEmitter2;
  let userService: UserService;
  let groupService: GroupService;
  let mediaService: MediaService;
  let mentionService: MentionService;
  let transactionMock;
  let sequelize: Sequelize;
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [
        PostService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            checkValidMedia: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValidMedia: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostModel),
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            addMedia: jest.fn(),
            destroy: jest.fn()
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            bulkCreate: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn()
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);
    postModelMock = moduleRef.get<typeof PostModel>(getModelToken(PostModel));
    postGroupModelMock = moduleRef.get<typeof PostGroupModel>(getModelToken(PostGroupModel));
    sentryService = moduleRef.get<SentryService>(SentryService);
    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
    userService = moduleRef.get<UserService>(UserService);
    groupService = moduleRef.get<GroupService>(GroupService);
    mentionService = moduleRef.get<MentionService>(MentionService);
    mediaService = moduleRef.get<MediaService>(MediaService);
    sequelize = moduleRef.get<Sequelize>(Sequelize);

    transactionMock = createMock<Transaction>({
      rollback: jest.fn(),
      commit: jest.fn(),
    });
    jest.spyOn(sequelize, 'transaction').mockResolvedValue(transactionMock);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('createPost', () => {
    it('Create post successfully', async () => {
      const mockedDataCreatePost = createMock<PostModel>(mockedPostList[0]);
      const { files, videos, images } = mockedCreatePostDto.data;
      const groupIds = mockedCreatePostDto.audience.groups.map((i) => i.id)
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      const mentionUserIds = mockedUpdatePostDto.mentions.map((i) => i.id);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      mentionService.checkValidMentions = jest.fn().mockResolvedValue(true);
      mentionService.create = jest.fn();
      postService.addPostGroup = jest.fn().mockResolvedValue(true);
      mediaService.activeMedia = jest.fn();
      eventEmitter.emit = jest.fn();

      postModelMock.create.mockResolvedValueOnce(mockedDataCreatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true);

      const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);
      expect(result).toBe(true); 
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1)
      expect(mentionService.checkValidMentions).toBeCalledWith(groupIds, mentionUserIds)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)

      expect(postModelMock.create).toHaveBeenCalledTimes(1);
      expect(mockedDataCreatePost.addMedia).toHaveBeenCalledWith(mediaIds);
      expect(sequelize.transaction).toBeCalledTimes(1);

      expect(mediaService.activeMedia).toBeCalledTimes(1)
      expect(mediaService.activeMedia).toBeCalledWith(mediaIds, mockedUserAuth.id)
      expect(mentionService.create).toBeCalledWith(mockedCreatePostDto.mentions.map((i) => ({
        entityId: mockedDataCreatePost.id,
        userId: i.id,
        mentionableType: MentionableType.POST,
      })))
      expect(postService.addPostGroup).toBeCalledTimes(1)
      expect(postService.addPostGroup).toHaveBeenCalledWith(groupIds, mockedDataCreatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      expect(eventEmitter.emit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledWith(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          id: mockedDataCreatePost.id,
          isDraft: mockedCreatePostDto.isDraft,
          data: mockedCreatePostDto.data,
          commentsCount: mockedDataCreatePost.commentsCount,
          actor: mockedUserAuth,
          mentions: mockedCreatePostDto.mentions,
          audience: mockedCreatePostDto.audience,
          setting: mockedCreatePostDto.setting,
        })
      );

      const createPostQuery: any = postModelMock.create.mock.calls[0][0];

      //add Reaction
      expect(createPostQuery).toStrictEqual({
        content: mockedCreatePostDto.data.content,
        isDraft: mockedCreatePostDto.isDraft,
        createdBy: mockedUserAuth.id,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedCreatePostDto.setting.isImportant,
        importantExpiredAt:
          mockedCreatePostDto.setting.isImportant === false
            ? null
            : mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact,
      });
    });

    it('Should catch exception if creator not found in cache', async () => {
      userService.get = jest.fn().mockResolvedValue(null);

      try {
        const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should catch exception if groups is invalid', async () => {
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(false);
      try {
        const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      userService.get = jest.fn().mockResolvedValue(true);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      mediaService.activeMedia = jest.fn().mockResolvedValue(true);

      postModelMock.create.mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });
  });

  describe('updatePost', () => {
    const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
    it('Update post successfully', async () => {
      const { files, videos, images } = mockedUpdatePostDto.data;
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      const groupIds = mockedUpdatePostDto.audience.groups.map((i) => i.id);
      const mentionUserIds = mockedUpdatePostDto.mentions.map((i) => i.id);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      mentionService.checkValidMentions = jest.fn().mockResolvedValue(true); 
      mentionService.setMention = jest.fn(); 
      postService.setGroupByPost = jest.fn().mockResolvedValue(true);
      mediaService.setMediaByPost = jest.fn();
      
      eventEmitter.emit = jest.fn();

      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true);

      const result = await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth.id, mockedUpdatePostDto);
      expect(result).toBe(true); 
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1)
      expect(mentionService.checkValidMentions).toBeCalledWith(groupIds, mentionUserIds)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)
      
      expect(sequelize.transaction).toBeCalledTimes(1);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);
      expect(mediaService.setMediaByPost).toHaveBeenCalledWith(mediaIds, mockedDataUpdatePost.id);      
      expect(mentionService.setMention).toBeCalledWith(mentionUserIds, MentionableType.POST, mockedDataUpdatePost.id)

      expect(postService.setGroupByPost).toBeCalledTimes(1)
      expect(postService.setGroupByPost).toHaveBeenCalledWith(groupIds, mockedDataUpdatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      expect(eventEmitter.emit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledWith(
        UpdatedPostEvent.event,
        new UpdatedPostEvent({
          updatedPost: {
            id: mockedDataUpdatePost.id,
            isDraft: mockedUpdatePostDto.isDraft,
            data: mockedUpdatePostDto.data,
            commentsCount: mockedDataUpdatePost.commentsCount,
            actor: mockedUserAuth,
            mentions: mockedUpdatePostDto.mentions,
            audience: mockedUpdatePostDto.audience,
            setting: mockedUpdatePostDto.setting,
          },
        })
      );

      const updatePostQuery: any = postModelMock.update.mock.calls[0][0];

      //add Reaction
      expect(updatePostQuery).toStrictEqual({
        content: mockedUpdatePostDto.data.content,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedUpdatePostDto.setting.isImportant,
        importantExpiredAt:
          mockedUpdatePostDto.setting.isImportant === false
            ? null
            : mockedUpdatePostDto.setting.importantExpiredAt,
        canShare: mockedUpdatePostDto.setting.canShare,
        canComment: mockedUpdatePostDto.setting.canComment,
        canReact: mockedUpdatePostDto.setting.canReact,
      });
    }); 

    it('Should catch exception if creator not found in cache', async () => {
      userService.get = jest.fn().mockResolvedValue(null);

      try {
        await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth.id, mockedUpdatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should catch exception if groups is invalid', async () => {
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(false);
      try {
        await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth.id, mockedUpdatePostDto);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      
      postModelMock.update.mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.updatePost(
          mockedDataUpdatePost.id,
          mockedUserAuth.id,
          mockedCreatePostDto
        );

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Post not found', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.updatePost(
          mockedDataUpdatePost.id,
          mockedUserAuth.id,
          mockedUpdatePostDto
        );
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });

    it('Not owner', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      try {
        await postService.updatePost(
          mockedDataUpdatePost.id,
          mockedUserAuth.id + 1,
          mockedUpdatePostDto
        );
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });
  });

  describe('publishPost', () => {
    it('Publish post successfully', async () => {
      const mockedDataUpdatePost = createMock<PostModel>({
        ... mockedPostList[0],
        ... {
          data: mockedUpdatePostDto.data
        },
        ...{
          setting: mockedUpdatePostDto.setting
        }
      });
      mockedDataUpdatePost.groups = createMock<PostGroupModel[]>([
        {
          postId: 1,
          groupId: 1,
        }
      ]); 
      mockedDataUpdatePost.mentions = createMock<MentionModel[]>([
        {
          id: 1,
          mentionableType: MentionableType.POST,
          entityId: 1,
          userId:1
        }
      ]); 
      //mockedDataUpdatePost.data = createMock(mockedUpdatePostDto.data); 
      userService.get = jest.fn().mockResolvedValueOnce(mockedUserAuth) 
      mentionService.resolveMentions = jest.fn().mockResolvedValueOnce(mockedUpdatePostDto.mentions);
      groupService.getMany = jest.fn().mockResolvedValueOnce(mockedUpdatePostDto.audience.groups); 
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      eventEmitter.emit = jest.fn();

      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);

      const result = await postService.publishPost(mockedDataUpdatePost.id, mockedUserAuth.id);
      expect(result).toBe(true);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);

      expect(eventEmitter.emit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledWith(
        PublishedPostEvent.event,
        new PublishedPostEvent({
          id: mockedDataUpdatePost.id,
          isDraft: mockedUpdatePostDto.isDraft,
          data: mockedUpdatePostDto.data,
          commentsCount: mockedDataUpdatePost.commentsCount,
          actor: mockedUserAuth,
          mentions: mockedUpdatePostDto.mentions,
          audience: mockedUpdatePostDto.audience,
          setting: mockedUpdatePostDto.setting,
        })
      );

      const [dataUpdate, condition]: any = postModelMock.update.mock.calls[0];
      expect(dataUpdate).toStrictEqual({
        isDraft: false,
      });
      expect(condition.where).toStrictEqual({
        id: mockedDataUpdatePost.id,
        createdBy: mockedUserAuth.id,
      });
    });

    it('Post not found', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      postModelMock.findOne.mockResolvedValueOnce(null); 
      try {
        await postService.publishPost(mockedDataUpdatePost.id, mockedUserAuth.id);
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });

    it('Not owner', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);
      try {
        await postService.publishPost(mockedDataUpdatePost.id, mockedUserAuth.id + 1);
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });
  });

  describe('deletePost', () => {
    const mockedDataDeletePost = createMock<PostModel>(mockedPostList[0]);
    it('Delete post successfully', async () => {
      userService.get = jest.fn().mockResolvedValueOnce(mockedUserAuth) 
      mentionService.resolveMentions = jest.fn().mockResolvedValueOnce(mockedUpdatePostDto.mentions);
      mentionService.setMention = jest.fn();
      mediaService.setMediaByPost = jest.fn();
      postService.setGroupByPost = jest.fn().mockResolvedValueOnce(true); 
      groupService.getMany = jest.fn().mockResolvedValueOnce(mockedUpdatePostDto.audience.groups); 
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      eventEmitter.emit = jest.fn();

      postModelMock.destroy.mockResolvedValueOnce(mockedDataDeletePost);

      const result = await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth.id);
      expect(result).toBe(true);
     
      expect(postModelMock.destroy).toHaveBeenCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledWith(
        DeletedPostEvent.event,
        new DeletedPostEvent(mockedDataDeletePost)
      );
      const [ condition ] = postModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        id: mockedDataDeletePost.id,
        createdBy: mockedUserAuth.id,
      });
    });

    it('Should rollback if have exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      postModelMock.destroy.mockRejectedValue(new Error('Any error when insert data to DB'));
      try {
        await postService.deletePost(mockedDataDeletePost.id, mockedUserAuth.id);
        expect(transactionMock.commit).not.toBeCalledTimes(1);
      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }
    });

    it('Should throw exception if user is not owner', async () => {
      postModelMock.findOne.mockResolvedValueOnce(mockedDataDeletePost);
      try {
        await postService.publishPost(mockedDataDeletePost.id, mockedUserAuth.id + 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });

    it('Should throw exception if post not exist', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        await postService.publishPost(mockedDataDeletePost.id, mockedUserAuth.id);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException); 
      }
    });
  });

  describe('updateCommentCountByPost', () => {
    it('Should excute query', async () => {
      sequelize.query = jest.fn();
      await postService.updateCommentCountByPost(1); 
      expect(sequelize.query).toBeCalledTimes(1);
    });
  });

  describe('addPostGroup', () => {
    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([],1); 
      expect(result).toBe(true);
    });

    it('Return if parameter is empty', async () => {
      const result = await postService.addPostGroup([1,2],1); 
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);
      expect(result).toBe(true);
    });
  });

  describe('setGroupByPost', () => {
    it('Should excute query', async () => {
      const currentGroupPost = createMock<PostGroupModel[]>([
        {
          postId: 1,
          groupId: 1
        },
        {
          postId: 1,
          groupId: 2
        }
      ])
      const mockData = {
        groupIds: [1, 3],
        postId: 1
      }
      postGroupModelMock.findAll.mockResolvedValueOnce(currentGroupPost);
      const result = await postService.setGroupByPost(mockData.groupIds, mockData.postId); 
      expect(result).toBe(true);
      expect(postGroupModelMock.destroy).toBeCalledTimes(1);
      expect(postGroupModelMock.bulkCreate).toBeCalledTimes(1);

      const [ condition ] = postGroupModelMock.destroy.mock.calls[0];
      expect(condition.where).toStrictEqual({
        groupId: [2], 
        postId: mockData.postId,
      });

      const createPostQuery: any = postGroupModelMock.bulkCreate.mock.calls[0][0];

      expect(createPostQuery).toStrictEqual([
        {
          groupId: 3,
          postId: mockData.postId
        }
      ]);

    });
  });

  describe('findPost', () => {
    const entity: EntityIdDto = {
      postId: 1,
      commentId: 1,
      reactionCommentId: 1,
      reactionPostId: 1
    }
    it('Should get post successfully', async () => {
      postModelMock.findOne.mockResolvedValueOnce({id:1});
      const result = await postService.findPost(entity);
      expect(postModelMock.findOne).toBeCalledTimes(1);

    });

    it('Catch exception', async () => {
      postModelMock.findOne.mockResolvedValueOnce(null);
      try {
        const result = await postService.findPost(entity);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });
});
