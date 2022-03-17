import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { IPost, PostModel } from '../../../database/models/post.model';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { mockedPostList, mockedCreatePost } from './mocks/post-list';
import { mockedUserAuth } from './mocks/user-auth';
import { HttpException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { SentryService } from '@app/sentry';
import { RedisModule } from '@app/redis';
import { UserService } from '../../../shared/user/user.service';
import { GroupService } from '../../../shared/group/group.service';
import { Sequelize } from 'sequelize-typescript';
import { MediaService } from '../../../modules/media/media.service';
import { MentionService } from '../../../modules/mention/mention.service';
import { Transaction } from 'sequelize';
import { UserSharedDto } from 'src/shared/user/dto';
import { CreatePostDto } from '../dto/requests';
import { CreatedPostEvent } from '../../../events/post/created-post.event';
import { PostGroupModel } from '../../../database/models/post-group.model';

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
            addMedia: jest.fn(),
          },
        },
        {
          provide: getModelToken(PostGroupModel),
          useValue: {
            bulkCreate: jest.fn()
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
      userService.get = jest.fn().mockResolvedValue(true);
      groupService.isMemberOfGroups = jest.fn().mockResolvedValue(true);
      mediaService.checkValidMedia = jest.fn().mockResolvedValue(true); 
      mediaService.activeMedia = jest.fn(); 
      eventEmitter.emit = jest.fn(); 
      const transactionMock = createMock<Transaction>({
        commit: jest.fn(),
        rollback: jest.fn(),
      });
      sequelize.transaction = jest.fn().mockResolvedValue(transactionMock);
      
      postModelMock.create.mockResolvedValueOnce(mockedDataCreatePost);
      postModelMock.addMedia.mockResolvedValueOnce(mockedDataCreatePost);
      postGroupModelMock.bulkCreate.mockResolvedValueOnce(true);

      const result = await postService.createPost(mockedUserAuth, mockedCreatePost);
      expect(postModelMock.create).toHaveBeenCalledTimes(1);
      expect(result).toBe(true); 
      expect(sequelize.transaction).toBeCalledTimes(1);
      expect(transactionMock.commit).toBeCalledTimes(1);
      expect(mediaService.activeMedia).toBeCalledTimes(1)
      expect(mediaService.checkValidMedia).toBeCalledTimes(1)
      //expect(mediaService.activeMedia).toBeCalledWith()

      expect(eventEmitter.emit).toBeCalledWith(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          post: mockedDataCreatePost,
          actor: mockedUserAuth,
          mentions: mockedCreatePost.mentions,
          audience: mockedCreatePost.audience,
          setting: mockedCreatePost.setting,
        })
      );
 
      const createPostQuery: any = postModelMock.create.mock.calls[0][0];
      const createPostGroupQuery: any = postGroupModelMock.bulkCreate.mock.calls[0][0];
      //const addMediaQuery: any = postModelMock.addMedia.mock.calls[0];
      //console.log('addMediaQuery=', addMediaQuery);
      //add Reaction
      expect(createPostQuery).toStrictEqual({
        content: mockedCreatePost.data.content,
        isDraft: mockedCreatePost.isDraft,
        createdBy: mockedUserAuth.userId,
        updatedBy: mockedUserAuth.userId,
        isImportant: mockedCreatePost.setting.isImportant,
        importantExpiredAt: mockedCreatePost.setting.isImportant === false ? null: mockedCreatePost.setting.importantExpiredAt,
        canShare: mockedCreatePost.setting.canShare,
        canComment: mockedCreatePost.setting.canComment,
        canReact: mockedCreatePost.setting.canReact
      });

      const postGroupExpected = mockedCreatePost.audience.groups.map(groupId => {
        return {
          postId: mockedDataCreatePost.id,
          groupId
        }
      })
      expect(createPostGroupQuery).toStrictEqual(postGroupExpected);
    });

    it('Should rollback if have an exception when insert data into DB', async () => {
      const mockedDataCreatePost = createMock<PostModel>(mockedPostList[0]);
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
        const result = await postService.createPost(mockedUserAuth, mockedCreatePost);

        expect(sequelize.transaction).toBeCalledTimes(1);
        expect(transactionMock.commit).not.toBeCalled();

      } catch (error) {
        expect(transactionMock.rollback).toBeCalledTimes(1);
      }

    });
  });
});