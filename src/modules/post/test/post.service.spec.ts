import { UpdatedPostEvent } from '../../../events/post/updated-post.event';
import { MentionableType } from '../../../common/constants/model.constant';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { mockedPostList, mockedCreatePostDto, mockedUpdatePostDto } from './mocks/post-list';
import { mockedUserAuth } from './mocks/user-auth';
import { HttpException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user/user.service';
import { GroupService } from '../../../shared/group/group.service';``
import { Sequelize } from 'sequelize-typescript';
import { MediaService } from '../../../modules/media/media.service';
import { MentionService } from '../../../modules/mention/mention.service';
import { Transaction } from 'sequelize';
import { UserSharedDto } from 'src/shared/user/dto';
import { CreatePostDto } from '../dto/requests';
import { CreatedPostEvent } from '../../../events/post/created-post.event';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostMediaModel } from '../../../database/models/post-media.model';

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
      imports: [
        RedisModule,
      ],
      providers: [
        PostService,
        {
          provide: EventEmitter2, 
          useValue: {
            emit: jest.fn()
          }
        },
        {
          provide: UserService, 
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: GroupService, 
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: MediaService, 
          useValue: {
            checkValidMedia: jest.fn()
          }
        },
        {
          provide: MentionService, 
          useValue: {
            checkValidMedia: jest.fn()
          }
        },
        { provide: Sequelize, 
          useValue: {
          transaction: jest.fn(),
          
        } },
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
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            bulkCreate: jest.fn(),
            findAll: jest.fn()
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
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      const mentionUserIds = mockedUpdatePostDto.mentions.map((i) => i.id);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      //mentionService.checkValidMentions = jest.fn().mockResolvedValue(true); 
      mentionService.create = jest.fn(); 
      postService.addPostGroup = jest.fn().mockResolvedValue(true);
      mediaService.activeMedia = jest.fn(); 
      eventEmitter.emit = jest.fn();
      const transactionMock = createMock<Transaction>({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      sequelize.transaction = jest.fn().mockResolvedValue(transactionMock);
      
      postModelMock.create.mockResolvedValueOnce(mockedDataCreatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true); 

      const result = await postService.createPost(mockedUserAuth.id, mockedCreatePostDto);
      expect(result).toBe(true); 
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1)
      //expect(mentionService.checkValidMentions).toBeCalledWith(mockedCreatePostDto.audience.groups, mockedCreatePostDto.data.content, mentionUserIds)
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
      expect(postService.addPostGroup).toHaveBeenCalledWith(mockedCreatePostDto.audience.groups, mockedDataCreatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      expect(eventEmitter.emit).toBeCalledTimes(1); 
      expect(eventEmitter.emit).toBeCalledWith(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          id: mockedDataCreatePost.id,
          isDraft: mockedCreatePostDto.isDraft,
          data: mockedCreatePostDto.data,
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
        importantExpiredAt: mockedCreatePostDto.setting.isImportant === false ? null: mockedCreatePostDto.setting.importantExpiredAt,
        canShare: mockedCreatePostDto.setting.canShare,
        canComment: mockedCreatePostDto.setting.canComment,
        canReact: mockedCreatePostDto.setting.canReact
      });
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      userService.get = jest.fn().mockResolvedValue(true);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      mediaService.activeMedia = jest.fn().mockResolvedValue(true); 
      const transactionMock = createMock<Transaction>({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      sequelize.transaction = jest.fn().mockResolvedValue(transactionMock);
      
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
    it('Update post successfully', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      const { files, videos, images } = mockedUpdatePostDto.data;
      let mediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      const mentionUserIds = mockedUpdatePostDto.mentions.map((i) => i.id);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);  
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      //mentionService.checkValidMentions = jest.fn().mockResolvedValue(true); 
      mentionService.setMention = jest.fn(); 
      postService.setPostGroup = jest.fn().mockResolvedValue(true);
      mediaService.setMediaPost = jest.fn();
      
      eventEmitter.emit = jest.fn();
      const transactionMock = createMock<Transaction>({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      sequelize.transaction = jest.fn().mockResolvedValue(transactionMock);
      
      postModelMock.update.mockResolvedValueOnce(mockedDataUpdatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true); 

      const result = await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth.id, mockedUpdatePostDto);
      expect(result).toBe(true); 
     
      expect(groupService.isMemberOfGroups).toBeCalledTimes(1)
      //expect(mentionService.checkValidMentions).toBeCalledWith(mockedUpdatePostDto.audience.groups, mockedUpdatePostDto.data.content, mentionUserIds)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)
      
      expect(sequelize.transaction).toBeCalledTimes(1);

      expect(postModelMock.update).toHaveBeenCalledTimes(1);
      expect(mediaService.setMediaPost).toHaveBeenCalledWith(mediaIds, mockedDataUpdatePost.id);      
      expect(mentionService.setMention).toBeCalledWith(mentionUserIds, MentionableType.POST, mockedDataUpdatePost.id)

      expect(postService.setPostGroup).toBeCalledTimes(1)
      expect(postService.setPostGroup).toHaveBeenCalledWith(mockedUpdatePostDto.audience.groups, mockedDataUpdatePost.id)
      expect(transactionMock.commit).toBeCalledTimes(1);

      expect(eventEmitter.emit).toBeCalledTimes(1);
      expect(eventEmitter.emit).toBeCalledWith(
        UpdatedPostEvent.event,
        new UpdatedPostEvent({
          updatedPost: {
            id: mockedDataUpdatePost.id,
            isDraft: mockedUpdatePostDto.isDraft,
            data: mockedUpdatePostDto.data,
            actor: mockedUserAuth,
            mentions: mockedUpdatePostDto.mentions,
            audience: mockedUpdatePostDto.audience,
            setting: mockedUpdatePostDto.setting,
          }
        })
      );
 
      const updatePostQuery: any = postModelMock.update.mock.calls[0][0];

      //add Reaction
      expect(updatePostQuery).toStrictEqual({
        content: mockedUpdatePostDto.data.content,
        isDraft: mockedUpdatePostDto.isDraft,
        updatedBy: mockedUserAuth.id,
        isImportant: mockedUpdatePostDto.setting.isImportant,
        importantExpiredAt: mockedUpdatePostDto.setting.isImportant === false ? null: mockedUpdatePostDto.setting.importantExpiredAt,
        canShare: mockedUpdatePostDto.setting.canShare,
        canComment: mockedUpdatePostDto.setting.canComment,
        canReact: mockedUpdatePostDto.setting.canReact
      });
    });

    it('Should rollback if have an exception when update data into DB', async () => {
      const mockedDataUpdatePost = createMock<PostModel>(mockedPostList[0]);
      userService.get = jest.fn().mockResolvedValue(mockedUserAuth);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true);
      postModelMock.findOne.mockResolvedValueOnce(mockedDataUpdatePost);  
      const transactionMock = createMock<Transaction>({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      sequelize.transaction = jest.fn().mockResolvedValue(transactionMock);
      
      postModelMock.update.mockRejectedValue(new Error('Any error when insert data to DB'));

      try {
        await postService.updatePost(mockedDataUpdatePost.id, mockedUserAuth.id, mockedCreatePostDto);

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();

      } catch (error) {
       // expect(transactionMock.rollback).toBeCalledTimes(1);
      }

    });
  });
});