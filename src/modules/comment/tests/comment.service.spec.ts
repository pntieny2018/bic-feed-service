import { Op } from 'sequelize';
import {
  createCommentDto,
  createCommentWithPostNotFoundDto,
  createdComment,
  createTextCommentDto,
  createTextCommentWithMentionInGroupDto,
  createTextCommentWithMentionNotInGroupDto,
} from './mocks/create-comment-dto.mock';
import { MediaService } from '../../media';
import { PageDto } from '../../../common/dto';
import { MentionService } from '../../mention';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { UserService } from '../../../shared/user';
import { AuthorityService } from '../../authority';
import { CommentService } from '../comment.service';
import { plainToInstance } from 'class-transformer';
import { GroupService } from '../../../shared/group';
import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../../post/post.service';
import { LogicException } from '../../../common/exceptions';
import { PostPolicyService } from '../../post/post-policy.service';
import { CommentModel } from '../../../database/models/comment.model';
import { MENTION_ERROR_ID } from '../../mention/errors/mention.error';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CommentResponseDto } from '../dto/response/comment.response.dto';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { authUserMock, authUserNotInGroupContainPostMock } from './mocks/user.mock';
import { getCommentMock, getCommentRawMock, getCommentsMock } from './mocks/get-comments.mock';

describe('CommentService', () => {
  let commentService: CommentService;
  let userService;
  let groupService;
  let mentionService;
  let authorityService;
  let postPolicyService;
  let sequelizeConnection;
  let commentModel;
  let postService;
  let mediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            sync: jest.fn(),
            destroyCommentMedia: jest.fn(),
            checkValidMedia: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            findPost: jest.fn(),
          },
        },
        {
          provide: PostPolicyService,
          useValue: {
            allow: jest.fn(),
          },
        },
        {
          provide: AuthorityService,
          useValue: {
            allowAccess: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValidMentions: jest.fn(),
            create: jest.fn(),
            resolveMentions: jest.fn(),
            bindMentionsToComment: jest.fn(),
            setMention: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
            isMemberOfSomeGroups: jest.fn(),
            isMemberOfGroups: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
            getMany: jest.fn(),
            bindUserToComment: jest.fn(),
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
        {
          provide: getModelToken(CommentModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    userService = module.get<UserService>(UserService);
    groupService = module.get<GroupService>(GroupService);
    mentionService = module.get<MentionService>(MentionService);
    authorityService = module.get<AuthorityService>(AuthorityService);
    postPolicyService = module.get<PostPolicyService>(PostPolicyService);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    postService = module.get<PostService>(PostService);
    mediaService = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(commentService).toBeDefined();
  });

  describe('CommentService.create', () => {
    describe('Create comment with post not existed', () => {
      it("should throw BadRequestException('The post does not exist !')", async () => {
        try {
          postService.findPost.mockRejectedValue(
            new BadRequestException('The post does not exist !')
          );
          await commentService.create(authUserMock, createCommentWithPostNotFoundDto);
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).message).toEqual('The post does not exist !');
        }
      });
    });

    describe('Create comment when user out group', () => {
      it("should throw ForbiddenException('You do not have permission to perform this action !')", async () => {
        try {
          authorityService.allowAccess.mockImplementation(() => {
            throw new ForbiddenException('You do not have permission to perform this action !');
          });
          await commentService.create(authUserNotInGroupContainPostMock, createTextCommentDto);
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenException);
          expect((e as ForbiddenException).message).toEqual(
            'You do not have permission to perform this action !'
          );
        }
      });
    });

    describe('Create comment with invalid mentions', () => {
      describe('user not in group audience', () => {
        it('should throw  LogicException(MENTION_ERROR_ID.USER_NOT_FOUND)', async () => {
          try {
            postService.findPost.mockResolvedValue({
              id: 1,
              groups: [
                {
                  groupId: 1,
                  postId: 1,
                },
              ],
            });

            authorityService.allowAccess.mockReturnThis();

            postPolicyService.allow.mockReturnThis();

            commentModel.create.mockResolvedValue({
              createdBy: 1,
              parentId: 0,
              content: ' hello',
              postId: 1,
            });

            mentionService.checkValidMentions.mockImplementation(() => {
              throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
            });

            await commentService.create(authUserMock, createTextCommentWithMentionNotInGroupDto);
          } catch (e) {
            expect(e).toBeInstanceOf(LogicException);
            expect((e as LogicException).id).toEqual(MENTION_ERROR_ID.USER_NOT_FOUND);
          }
        });
      });
    });

    describe('Create comment with invalid media', () => {
      describe('media not exist', () => {});
      describe('is not owner of media', () => {});
    });

    describe('Create comment with valid data', () => {
      it('should create successfully', async () => {
        postService.findPost.mockResolvedValue({
          id: 2,
          groups: [
            {
              groupId: 1,
              postId: 2,
            },
          ],
        });

        authorityService.allowAccess.mockReturnThis();

        postPolicyService.allow.mockReturnThis();

        sequelizeConnection.transaction.mockImplementation(() => ({
          commit: jest.fn().mockReturnThis(),
          rollback: jest.fn().mockReturnThis(),
        }));

        commentModel.create.mockResolvedValue({
          id: 1,
          ...createTextCommentWithMentionInGroupDto,
        });

        mentionService.checkValidMentions.mockResolvedValue();

        mentionService.create.mockReturnThis();

        mediaService.checkValidMedia.mockResolvedValue({});

        mediaService.sync.mockReturnThis();

        const getCommentSpy = jest
          .spyOn(commentService, 'getComment')
          .mockResolvedValue(createdComment);

        await commentService.create(authUserMock, createCommentDto);

        expect(postService.findPost).toBeCalled();

        expect(authorityService.allowAccess).toBeCalled();

        expect(postPolicyService.allow).toBeCalled();

        expect(sequelizeConnection.transaction).toBeCalled();

        expect(commentModel.create).toBeCalled();

        expect(mentionService.checkValidMentions).toBeCalled();

        expect(mentionService.create).toBeCalled();

        expect(mediaService.sync).toBeCalled();

        const syncParams = mediaService.sync.mock.calls[0];

        expect(syncParams).toEqual([1, 'comment', [1]]);

        expect(getCommentSpy).toBeCalled();
      });
    });
  });

  describe('CommentService.update', () => {
    describe('Update comment with comment not existed', () => {
      it("should throw BadRequestException('The comment 1 does not exist !')", async () => {
        try {
          commentModel.findOne.mockResolvedValue(null);

          await commentService.update(authUserNotInGroupContainPostMock, 1, {
            content: 'create text comment',
            media: {
              files: [],
              images: [],
              videos: [],
            },
          });
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).message).toEqual(`Comment 1 not found`);
        }
      });
    });

    describe('Update comment with post not existed', () => {
      it("should throw BadRequestException('The post does not exist !')", async () => {
        try {
          commentModel.findOne.mockResolvedValue({
            postId: 1,
          });
          postService.findPost.mockRejectedValue(
            new BadRequestException('The post does not exist !')
          );
          await commentService.create(authUserMock, createCommentWithPostNotFoundDto);
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).message).toEqual('The post does not exist !');
        }
      });
    });

    describe('Update comment when user out group', () => {
      it("should throw ForbiddenException('You do not have permission to perform this action !')", async () => {
        try {
          commentModel.findOne.mockResolvedValue({
            postId: 1,
          });

          postService.findPost.mockResolvedValue({
            groups: [
              {
                groupId: 10,
                postId: 1,
              },
            ],
          });
          authorityService.allowAccess.mockImplementation(() => {
            throw new ForbiddenException('You do not have permission to perform this action !');
          });
          await commentService.update(authUserNotInGroupContainPostMock, 1, {
            content: 'create text comment',
            media: {
              files: [],
              images: [],
              videos: [],
            },
          });
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenException);
          expect((e as ForbiddenException).message).toEqual(
            'You do not have permission to perform this action !'
          );
        }
      });
    });

    describe('Update comment with invalid mentions', () => {
      describe('user not in group audience', () => {
        it('should throw  LogicException(MENTION_ERROR_ID.USER_NOT_FOUND)', async () => {
          try {
            commentModel.findOne.mockResolvedValue({
              postId: 1,
              update: jest.fn().mockResolvedValue({
                id: 1,
              }),
            });

            postService.findPost.mockResolvedValue({
              id: 1,
              groups: [
                {
                  groupId: 1,
                  postId: 1,
                },
              ],
            });

            authorityService.allowAccess.mockReturnThis();

            postPolicyService.allow.mockReturnThis();

            mentionService.checkValidMentions.mockImplementation(() => {
              throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
            });

            await commentService.update(authUserMock, 1, createTextCommentWithMentionNotInGroupDto);
          } catch (e) {
            expect(e).toBeInstanceOf(LogicException);
            expect((e as LogicException).id).toEqual(MENTION_ERROR_ID.USER_NOT_FOUND);
          }
        });
      });
    });

    describe('Update comment with invalid media', () => {
      describe('media not exist', () => {});
      describe('is not owner of media', () => {});
    });

    describe('Update comment with valid data', () => {
      it('should updated successfully', async () => {
        commentModel.findOne.mockResolvedValue({
          id: 1,
          postId: 2,
          update: jest.fn().mockResolvedValue({
            id: 1,
            content: 'create text mention comment @bret.josh',
          }),
        });

        postService.findPost.mockResolvedValue({
          id: 2,
          groups: [
            {
              groupId: 1,
              postId: 2,
            },
          ],
        });

        authorityService.allowAccess.mockReturnThis();

        postPolicyService.allow.mockReturnThis();

        sequelizeConnection.transaction.mockImplementation(() => ({
          commit: jest.fn().mockReturnThis(),
          rollback: jest.fn().mockReturnThis(),
        }));

        mentionService.checkValidMentions.mockResolvedValue();

        mentionService.setMention.mockResolvedValue({});

        mediaService.checkValidMedia.mockResolvedValue({});

        mediaService.sync.mockReturnThis();

        const getCommentSpy = jest
          .spyOn(commentService, 'getComment')
          .mockResolvedValue(createdComment);

        await commentService.update(authUserMock, 1, createCommentDto);

        expect(postService.findPost).toBeCalled();

        expect(authorityService.allowAccess).toBeCalled();

        expect(postPolicyService.allow).toBeCalled();

        expect(sequelizeConnection.transaction).toBeCalled();

        expect(mentionService.checkValidMentions).toBeCalled();

        expect(mentionService.setMention).toBeCalled();

        expect(mediaService.sync).toBeCalled();

        const syncParams = mediaService.sync.mock.calls[0];

        expect(syncParams).toEqual([1, 'comment', [1]]);

        expect(getCommentSpy).toBeCalled();
      });
    });
  });

  describe('CommentService.delete', () => {
    describe('Delete comment does not existed', () => {
      it('should return false', async () => {
        const commentNotExistedId = 1;

        commentModel.findOne.mockResolvedValue(null);
        try {
          await commentService.destroy(authUserMock, commentNotExistedId);
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).message).toEqual(
            `Comment ${commentNotExistedId} not found`
          );
        }
      });
    });

    describe('Delete comment when user is not owner', () => {
      it('should return false', async () => {
        const notOwnerCommentId = 2;

        commentModel.findOne.mockResolvedValue(null);
        try {
          await commentService.destroy(authUserMock, notOwnerCommentId);
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect((e as BadRequestException).message).toEqual(
            `Comment ${notOwnerCommentId} not found`
          );
        }
      });
    });

    describe('Delete comment when user out group', () => {
      it("should throw ForbiddenException('You do not have permission to perform this action !')", async () => {
        const commentId = 3;

        commentModel.findOne.mockResolvedValue({
          id: 1,
        });

        postService.findPost.mockResolvedValue({
          groups: [
            {
              postId: 1,
              groupId: 1,
            },
            {
              postId: 1,
              groupId: 2,
            },
          ],
        });

        authorityService.allowAccess.mockImplementation(() => {
          throw new ForbiddenException('You do not have permission to perform this action !');
        });

        try {
          await commentService.destroy(authUserMock, commentId);
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenException);
          expect((e as ForbiddenException).message).toEqual(
            'You do not have permission to perform this action !'
          );
        }
      });
    });

    it('should delete comment and relationship successfully', async () => {
      const commentId = 10;

      commentModel.findOne.mockResolvedValue({
        id: 1,
        destroy: jest.fn(),
      });

      postService.findPost.mockResolvedValue({
        groups: [
          {
            postId: 1,
            groupId: 1,
          },
          {
            postId: 1,
            groupId: 2,
          },
        ],
      });

      authorityService.allowAccess.mockReturnThis();

      mediaService.destroyCommentMedia.mockResolvedValue({});

      mentionService.destroy.mockResolvedValue({});

      commentModel.destroy.mockResolvedValue(1);

      // const trxCommit = await sequelizeConnection.transaction().commit.mockResolvedValue(1);

      const deletedFlag = await commentService.destroy(authUserMock, commentId);

      expect(commentModel.findOne).toBeCalled();
      expect(postService.findPost).toBeCalled();
      expect(authorityService.allowAccess).toBeCalled();
      expect(mediaService.destroyCommentMedia).toBeCalled();
      expect(mentionService.destroy).toBeCalled();
      // expect(trxCommit).toBeCalled();
      expect(deletedFlag).toBeTruthy();
    });

    it('should delete comment and relationship false and throw exception', async () => {
      const commentId = 10;

      commentModel.findOne.mockResolvedValue({
        id: 1,
        destroy: jest.fn(() => Promise.reject(new Error('connect error'))),
      });

      postService.findPost.mockResolvedValue({
        groups: [
          {
            postId: 1,
            groupId: 1,
          },
          {
            postId: 1,
            groupId: 2,
          },
        ],
      });

      authorityService.allowAccess.mockReturnValue({});

      mediaService.destroyCommentMedia.mockReturnValue(Promise.resolve());

      mentionService.destroy.mockReturnValue(Promise.resolve());

      // const trxRollback = (await sequelizeConnection.transaction()).rollback.mockResolvedValue(1);

      const loggerSpy = jest.spyOn(commentService['_logger'], 'error').mockReturnThis();

      await commentService.destroy(authUserMock, commentId);

      expect(commentModel.findOne).toBeCalled();
      expect(postService.findPost).toBeCalled();
      expect(authorityService.allowAccess).toBeCalled();
      expect(mediaService.destroyCommentMedia).toBeCalled();
      expect(mentionService.destroy).toBeCalled();
      expect(loggerSpy).toBeCalled();
      // expect(trxRollback).toBeCalled();
    });
  });

  describe('CommentService.getComments', () => {
    describe('Get comments with idGT', () => {
      it('should make condition query with Op.gt', async () => {
        try {
          const logSpy = jest.spyOn(commentService['_logger'], 'debug').mockReturnThis();

          const expectResponse = plainToInstance(CommentResponseDto, getCommentsMock);

          const classTransformer = jest
            .spyOn(commentService['_classTransformer'], 'plainToInstance')
            .mockReturnValue(expectResponse);

          const fakeModel = (getCommentsMock as any[]).map((i) => {
            i['toJSON'] = () => i;
            return i;
          });

          commentModel.findAndCountAll.mockResolvedValue({
            rows: fakeModel,
            count: 1,
          });

          mentionService.bindMentionsToComment.mockResolvedValue(getCommentsMock);

          const bindCommentSpy = jest.spyOn(commentService, 'bindUserToComment').mockResolvedValue([
            {
              id: 1,
              parentId: null,
              postId: 1,
              content: 'hello',
              createdBy: 1,
              updatedBy: 1,
              createdAt: '2022-03-11T08:39:58.832Z',
              updatedAt: '2022-03-11T08:39:58.832Z',
              reactionsCount: '1=',
              media: [],
              mentions: [],
              ownerReactions: [],
              child: [[Object]],
              actor: {
                id: 1,
                username: 'bret.josh',
                fullname: 'Bret Josh',
                avatar: 'https://bein.group/josh.png',
              },
            },
            {
              id: 2,
              parentId: 1,
              postId: 1,
              content: 'hello',
              createdBy: 2,
              updatedBy: 2,
              createdAt: '2022-03-11T08:41:35.047Z',
              updatedAt: '2022-03-11T08:41:35.047Z',
              reactionsCount: '1=',
              media: [],
              mentions: [],
              ownerReactions: [],
              child: [],
              actor: {
                id: 2,
                username: 'caitlyn.back',
                fullname: 'Caitlyn Back',
                avatar: 'https://bein.group/back.png',
              },
            },
          ] as any);

          const response = await commentService.getComments(authUserMock, {
            idGT: 1,
            postId: 1,
          });

          const whereClause = commentModel.findAndCountAll.mock.calls[0][0]['where'];

          expect(logSpy).toBeCalled();

          expect(whereClause).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.gt]: 1 },
          });

          expect(bindCommentSpy).toBeCalled();

          expect(classTransformer).toBeCalled();

          expect(response).toBeInstanceOf(PageDto);

          expect(response.list[0]).toBeInstanceOf(CommentResponseDto);

          expect(response.list[0]).toEqual(expectResponse);
        } catch (e) {
          throw e;
        }
      });
    });

    describe('Get comments with idGTE', () => {
      it('should make condition query with Op.gte', async () => {
        commentModel.findAndCountAll.mockReturnThis();
        try {
          await commentService.getComments(authUserMock, {
            idGTE: 1,
            postId: 1,
          });
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAndCountAll.mock.calls[0][0]['where'];

          expect(whereClause).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.gte]: 1 },
          });
        }
      });
    });

    describe('Get comments with idLT', () => {
      it('should make condition query with Op.lt', async () => {
        commentModel.findAndCountAll.mockReturnThis();
        try {
          await commentService.getComments(authUserMock, {
            idLT: 1,
            postId: 1,
          });
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAndCountAll.mock.calls[0][0]['where'];

          expect(whereClause).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.lt]: 1 },
          });
        }
      });
    });

    describe('Get comments with idLTE', () => {
      it('should make condition query with Op.lte', async () => {
        commentModel.findAndCountAll.mockReturnThis();
        try {
          await commentService.getComments(authUserMock, {
            idLTE: 1,
            postId: 1,
          });
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAndCountAll.mock.calls[0][0]['where'];

          expect(whereClause).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.lte]: 1 },
          });
        }
      });
    });

    describe('Get comments with offset', () => {
      it('should make offset query', async () => {
        commentModel.findAndCountAll.mockReturnThis();
        try {
          await commentService.getComments(authUserMock, {
            offset: 0,
            postId: 1,
          });
        } catch (e) {
          const offsetClause = commentModel.findAndCountAll.mock.calls[0][0]['offset'];
          expect(offsetClause).toBe(0);
        }
      });
    });
  });

  describe('CommentService.getComment', () => {
    it('should return comment', async () => {
      const logSpy = jest.spyOn(commentService['_logger'], 'debug').mockReturnThis();

      commentModel.findOne.mockResolvedValue({
        ...getCommentRawMock,
        toJSON: () => getCommentRawMock,
      });

      mentionService.bindMentionsToComment.mockResolvedValue(Promise.resolve());

      const bindUserToCommentSpy = jest
        .spyOn(commentService, 'bindUserToComment')
        .mockResolvedValue(Promise.resolve());

      const classTransformerSpy = jest
        .spyOn(commentService['_classTransformer'], 'plainToInstance')
        .mockImplementation(() => getCommentMock);
      const comment = await commentService.getComment(authUserMock, 57);

      expect(logSpy).toBeCalled();
      expect(commentModel.findOne).toBeCalled();
      expect(mentionService.bindMentionsToComment).toBeCalled();
      expect(bindUserToCommentSpy).toBeCalled();
      expect(classTransformerSpy).toBeCalled();
      expect(comment).toEqual(getCommentMock);
    });
  });

  describe('CommentService.bindUserToComment', () => {
    describe('Happy case: ', () => {
      it('should add actor property to comment response', async () => {
        const actorCommentMock = [
          {
            id: 1,
            fullname: 'Bret Josh',
            username: 'bret.josh',
            avatar: 'https://bein.group/josh.png',
          },
          {
            id: 2,
            fullname: 'Caitlyn Back',
            username: 'caitlyn.back',
            avatar: 'https://bein.group/back.png',
          },
        ];
        userService.getMany.mockResolvedValue(actorCommentMock);

        const commentResponse = getCommentsMock;

        await commentService.bindUserToComment(commentResponse as any);

        expect(userService.getMany).toBeCalled();

        expect(commentResponse[0]['actor']).toEqual(actorCommentMock[0]);

        expect(commentResponse[0]['child'][0]['actor']).toEqual(actorCommentMock[1]);

        expect(commentResponse[1]['actor']).toEqual(actorCommentMock[1]);
      });
    });

    describe('Redis die or no data', () => {
      it('should missing actor property to comment response', async () => {
        const actorCommentNullMock = [];

        userService.getMany.mockResolvedValue(actorCommentNullMock);

        const commentNoActorResponse = getCommentsMock;

        await commentService.bindUserToComment(commentNoActorResponse as any);

        expect(userService.getMany).toBeCalled();

        expect(commentNoActorResponse[0]['actor']).toBeUndefined();

        expect(commentNoActorResponse[0]['child'][0]['actor']).toBeUndefined();

        expect(commentNoActorResponse[1]['actor']).toBeUndefined();
      });
    });
  });
});
