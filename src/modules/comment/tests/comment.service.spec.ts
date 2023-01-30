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
import { CommentResponseDto } from '../dto/response';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { authUserMock, authUserNotInGroupContainPostMock } from './mocks/user.mock';
import { getCommentMock, getCommentRawMock, getCommentsMock } from './mocks/get-comments.mock';
import { ReactionService } from '../../reaction';
import { FollowService } from '../../follow';
import { CommentEditedHistoryModel } from '../../../database/models/comment-edited-history.model';
import { GiphyService } from '../../giphy';
import { SentryService } from '@app/sentry';
import { CommentHistoryService } from '../comment-history.service';

describe('CommentService', () => {
  let commentService: CommentService;
  let userService;
  let mentionService;
  let authorityService;
  let postPolicyService;
  let sequelizeConnection;
  let commentModel;
  let postService;
  let mediaService;
  let giphyService;
  let reactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        CommentHistoryService,
        {
          provide: FollowService,
          useValue: {},
        },
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
            deleteMediaByEntityIds: jest.fn(),
          },
        },
        {
          provide: PostService,
          useValue: {
            findPost: jest.fn(),
            getEntityIdsReportedByUser: jest.fn()
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
            checkCanReadPost: jest.fn(),
          },
        },
        {
          provide: MentionService,
          useValue: {
            checkValid: jest.fn(),
            create: jest.fn(),
            resolve: jest.fn(),
            bindToComment: jest.fn(),
            setMention: jest.fn(),
            destroy: jest.fn(),
            deleteByEntityIds: jest.fn(),
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
          provide: GiphyService,
          useValue: {
            saveGiphyData: jest.fn(),
            bindUrlToComment: jest.fn(),
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
          provide: ReactionService,
          useValue: {
            deleteReactionByCommentIds: jest.fn(),
            bindReactionToComments: jest.fn(),
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
            escape: jest.fn(),
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
            findByPk: jest.fn(),
          },
        },
        {
          provide: getModelToken(CommentEditedHistoryModel),
          useValue: {
            findOne: jest.fn(),
            findAndCountAll: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
    userService = module.get<UserService>(UserService);
    mentionService = module.get<MentionService>(MentionService);
    authorityService = module.get<AuthorityService>(AuthorityService);
    postPolicyService = module.get<PostPolicyService>(PostPolicyService);
    sequelizeConnection = module.get<Sequelize>(Sequelize);
    commentModel = module.get<typeof CommentModel>(getModelToken(CommentModel));
    postService = module.get<PostService>(PostService);
    mediaService = module.get<MediaService>(MediaService);
    giphyService = module.get<GiphyService>(GiphyService);
    reactionService = module.get<ReactionService>(ReactionService);
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
          authorityService.checkCanReadPost.mockImplementation(() => {
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

            authorityService.checkCanReadPost.mockReturnThis();

            postPolicyService.allow.mockReturnThis();

            commentModel.create.mockResolvedValue({
              createdBy: 1,
              parentId: 0,
              content: ' hello',
              postId: 1,
              destroy: jest.fn(),
            });

            mentionService.checkValid.mockImplementation(() => {
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

    describe.skip('Create comment with valid data', () => {
      it('should create successfully', async () => {
        postService.findPost.mockResolvedValue({
          id: createdComment.postId,
          groups: [
            {
              groupId: 1,
              postId: createdComment.postId,
            },
          ],
        });

        authorityService.checkCanReadPost.mockReturnThis();

        postPolicyService.allow.mockReturnThis();

        sequelizeConnection.transaction.mockImplementation(() => ({
          commit: jest.fn().mockReturnThis(),
          rollback: jest.fn().mockReturnThis(),
        }));

        commentModel.create.mockResolvedValue({
          id: createdComment.id,
          ...createTextCommentWithMentionInGroupDto,
        });

        mentionService.checkValid.mockResolvedValue();

        mentionService.create.mockReturnThis();

        mediaService.checkValidMedia.mockResolvedValue({});

        mediaService.sync.mockReturnThis();

        const getCommentSpy = jest
          .spyOn(commentService, 'getComment')
          .mockResolvedValue(createdComment);

        await commentService.create(authUserMock, createCommentDto);

        expect(postService.findPost).toBeCalled();

        expect(authorityService.checkCanReadPost).toBeCalled();

        expect(postPolicyService.allow).toBeCalled();

        expect(sequelizeConnection.transaction).toBeCalled();

        expect(commentModel.create).toBeCalled();

        expect(mentionService.checkValid).toBeCalled();

        expect(mentionService.create).toBeCalled();

        expect(mediaService.sync).toBeCalled();

        expect(giphyService.saveGiphyData).toBeCalled();

        const syncParams = mediaService.sync.mock.calls[0];

        expect(JSON.stringify(syncParams)).toEqual(
          JSON.stringify([
            createdComment.id,
            'comment',
            [createCommentDto.media.images[0].id],
            sequelizeConnection.transaction(),
          ])
        );
      });
    });

    describe.skip('Reply a existed comment', () => {
      it('Should create successfully', async () => {
        commentModel.findOne.mockResolvedValue({
          ...createdComment,
          post: {
            id: createdComment.id,
            groups: [
              {
                groupId: 1,
                postId: createdComment.id,
              },
            ],
          },
          toJSON: () => ({
            ...createdComment,
            post: {
              id: createdComment.id,
              groups: [
                {
                  groupId: 1,
                  postId: createdComment.id,
                },
              ],
            },
          }),
        });

        authorityService.checkCanReadPost.mockReturnThis();

        postPolicyService.allow.mockReturnThis();

        sequelizeConnection.transaction.mockImplementation(() => ({
          commit: jest.fn().mockReturnThis(),
          rollback: jest.fn().mockReturnThis(),
        }));

        const newCommentId = 'ea56395f-7464-4192-b5ac-7ff830b8d6b5';
        commentModel.create.mockResolvedValue({
          id: newCommentId,
          ...createTextCommentWithMentionInGroupDto,
        });

        mentionService.checkValid.mockResolvedValue();

        mentionService.create.mockReturnThis();

        mediaService.checkValidMedia.mockResolvedValue({});

        mediaService.sync.mockReturnThis();
        postService.findPost = jest.fn().mockResolvedValue({id: '10dc4093-1bd0-4105-869f-8504e1986145', groups: [ {groupId: 1}]})
        const getCommentSpy = jest
          .spyOn(commentService, 'getComment')
          .mockResolvedValue(createdComment);

        await commentService.create(authUserMock, createCommentDto, createdComment.id);

        expect(authorityService.checkCanReadPost).toBeCalled();

        expect(commentModel.findOne).toBeCalled();

        expect(postPolicyService.allow).toBeCalled();

        expect(sequelizeConnection.transaction).toBeCalled();

        expect(commentModel.create).toBeCalled();

        expect(mentionService.checkValid).toBeCalled();

        expect(mentionService.create).toBeCalled();

        expect(mentionService.create).toBeCalled();

        expect(mediaService.sync).toBeCalled();

        expect(giphyService.saveGiphyData).toBeCalled();

        const syncParams = mediaService.sync.mock.calls[0];

        expect(JSON.stringify(syncParams)).toEqual(
          JSON.stringify([
            newCommentId,
            'comment',
            [createCommentDto.media.images[0].id],
            sequelizeConnection.transaction(),
          ])
        );
      });
    });
  });

  describe.skip('CommentService.update', () => {
    describe('Update comment with comment not existed', () => {
      it("should throw BadRequestException('The comment 1 does not exist !')", async () => {
        try {
          commentModel.findOne.mockResolvedValue(null);

          await commentService.update(
            authUserNotInGroupContainPostMock,
            '10dc4093-1bd0-4105-869f-8504e1986145',
            {
              content: 'create text comment',
              media: {
                files: [],
                images: [],
                videos: [],
              },
            }
          );
        } catch (e) {
          expect(e).toBeInstanceOf(LogicException);
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
            toJSON: () => ({ postId: 1 }),
          });

          postService.findPost.mockResolvedValue({
            groups: [
              {
                groupId: 10,
                postId: 1,
              },
            ],
          });
          authorityService.checkCanReadPost.mockImplementation(() => {
            throw new ForbiddenException('You do not have permission to perform this action !');
          });
          userService.getMany.mockResolvedValue([]);
          await commentService.update(
            authUserNotInGroupContainPostMock,
            '10dc4093-1bd0-4105-869f-8504e1986145',
            {
              content: 'create text comment',
              media: {
                files: [],
                images: [],
                videos: [],
              },
            }
          );
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenException);
          expect((e as ForbiddenException).message).toEqual(
            'You do not have permission to perform this action !'
          );
        }
      });
    });

    describe.skip('Update comment with invalid mentions', () => {
      describe('user not in group audience', () => {
        it('should throw  LogicException(MENTION_ERROR_ID.USER_NOT_FOUND)', async () => {
          try {
            commentModel.findOne.mockResolvedValue({
              postId: 1,
              update: jest.fn().mockResolvedValue({
                id: 1,
              }),
              toJSON: () => ({
                postId: 1,
                update: jest.fn().mockResolvedValue({
                  id: 1,
                }),
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

            userService.getMany.mockResolvedValue([]);

            authorityService.checkCanReadPost.mockReturnThis();

            postPolicyService.allow.mockReturnThis();

            mentionService.checkValid.mockImplementation(() => {
              throw new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND);
            });

            await commentService.update(
              authUserMock,
              '10dc4093-1bd0-4105-869f-8504e1986145',
              createTextCommentWithMentionNotInGroupDto
            );
          } catch (e) {
            expect(e).toBeInstanceOf(LogicException);
            expect((e as LogicException).id).toEqual(MENTION_ERROR_ID.USER_NOT_FOUND);
          }
        });
      });
    });

    describe.skip('Update comment with invalid media', () => {
      describe('media not exist', () => {});
      describe('is not owner of media', () => {});
    });

    describe.skip('Update comment with valid data', () => {
      it('should updated successfully', async () => {
        commentModel.findOne.mockResolvedValue({
          id: createdComment.id,
          postId: createdComment.postId,
          update: jest.fn().mockResolvedValue({
            id: createdComment.id,
            content: 'create text mention comment @bret.josh',
          }),
          toJSON: () => ({
            id: createdComment.id,
            postId: createdComment.postId,
            update: jest.fn().mockResolvedValue({
              id: createdComment.id,
              content: 'create text mention comment @bret.josh',
            }),
          }),
        });

        postService.findPost.mockResolvedValue({
          id: createdComment.postId,
          groups: [
            {
              groupId: 1,
              postId: createdComment.postId,
            },
          ],
        });

        authorityService.checkCanReadPost.mockReturnThis();

        postPolicyService.allow.mockReturnThis();

        sequelizeConnection.transaction.mockImplementation(() => ({
          commit: jest.fn().mockReturnThis(),
          rollback: jest.fn().mockReturnThis(),
        }));

        mentionService.checkValid.mockResolvedValue();

        mentionService.setMention.mockResolvedValue({});

        mediaService.checkValidMedia.mockResolvedValue({});

        mediaService.sync.mockReturnThis();

        const getCommentSpy = jest
          .spyOn(commentService, 'getComment')
          .mockResolvedValue(createdComment);

        await commentService.update(authUserMock, createdComment.id, createCommentDto);

        expect(postService.findPost).toBeCalled();

        expect(authorityService.checkCanReadPost).toBeCalled();

        expect(postPolicyService.allow).toBeCalled();

        expect(sequelizeConnection.transaction).toBeCalled();

        expect(mentionService.checkValid).toBeCalled();

        expect(mentionService.setMention).toBeCalled();

        expect(mediaService.sync).toBeCalled();

        expect(giphyService.saveGiphyData).toBeCalled();

        const syncParams = mediaService.sync.mock.calls[0];

        expect(JSON.stringify(syncParams)).toEqual(
          JSON.stringify([
            createdComment.id,
            'comment',
            [createCommentDto.media.images[0].id],
            sequelizeConnection.transaction(),
          ])
        );

        // expect(getCommentSpy).toBeCalled();
      });
    });
  });

  describe.skip('CommentService.delete', () => {
    describe('Delete comment does not existed', () => {
      it('should return false', async () => {
        const commentNotExistedId = '10dc4093-1bd0-4105-869f-8504e1986145';

        commentModel.findOne.mockResolvedValue(null);
        try {
          await commentService.destroy(authUserMock, commentNotExistedId);
        } catch (e) {
          expect(e).toBeInstanceOf(LogicException);
        }
      });
    });

    describe.skip('Delete comment when user is not owner', () => {
      it('should return false', async () => {
        const notOwnerCommentId = '20dc4093-1bd0-4105-869f-8504e1986145';

        commentModel.findOne.mockResolvedValue(null);
        try {
          await commentService.destroy(authUserMock, notOwnerCommentId);
        } catch (e) {
          expect(e).toBeInstanceOf(LogicException);
        }
      });
    });

    describe.skip('Delete comment when user out group', () => {
      it("should throw ForbiddenException('You do not have permission to perform this action !')", async () => {
        const commentId = '30dc4093-1bd0-4105-869f-8504e1986145';

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

        authorityService.checkCanReadPost.mockImplementation(() => {
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
      const commentId = '99dc4093-1bd0-4105-869f-8504e1986145';

      commentModel.findOne.mockResolvedValue({
        id: 1,
        destroy: jest.fn(),
        toJSON: () => ({ id: 1, destroy: jest.fn() }),
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

      authorityService.checkCanReadPost.mockReturnThis();

      mediaService.sync.mockResolvedValue({});

      mentionService.destroy.mockResolvedValue({});

      commentModel.destroy.mockResolvedValue(1);

      // const trxCommit = await sequelizeConnection.transaction().commit.mockResolvedValue(1);

      const deletedFlag = await commentService.destroy(authUserMock, commentId);

      expect(commentModel.findOne).toBeCalled();
      expect(postService.findPost).toBeCalled();
      expect(authorityService.checkCanReadPost).toBeCalled();
      expect(mediaService.sync).toBeCalled();
      expect(mentionService.destroy).toBeCalled();
      // expect(trxCommit).toBeCalled();
      expect(deletedFlag).toBeTruthy();
    });

    it('should delete comment and relationship false and throw exception', async () => {
      commentModel.findOne.mockResolvedValue({
        id: createdComment.id,
        destroy: jest.fn().mockRejectedValue(new Error('connect error')),
      });

      postService.findPost.mockResolvedValue({
        groups: [
          {
            postId: createdComment.postId,
            groupId: 1,
          },
          {
            postId: createdComment.postId,
            groupId: 2,
          },
        ],
      });

      authorityService.checkCanReadPost.mockReturnValue({});

      mediaService.sync.mockReturnValue(Promise.resolve());

      mentionService.destroy.mockReturnValue(Promise.resolve());

      // const trxRollback = (await sequelizeConnection.transaction()).rollback.mockResolvedValue(1);

      const loggerSpy = jest.spyOn(commentService['_logger'], 'error').mockReturnThis();

      try {
        await commentService.destroy(authUserMock, createdComment.id);
      } catch (e) {
        expect(e.message).toEqual('connect error');
      }

      expect(commentModel.findOne).toBeCalled();
      expect(postService.findPost).toBeCalled();
      expect(authorityService.checkCanReadPost).toBeCalled();
      expect(mediaService.sync).toBeCalled();
      expect(mentionService.destroy).toBeCalled();
      expect(loggerSpy).toBeCalled();
      // expect(trxRollback).toBeCalled();
    });
  });

  describe.skip('CommentService.getComments', () => {
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

          sequelizeConnection.query.mockResolvedValue(fakeModel);

          reactionService.bindReactionToComments.mockResolvedValue(getCommentsMock);
          mentionService.bindToComment.mockResolvedValue(getCommentsMock);
          giphyService.bindUrlToComment.mockResolvedValue(getCommentsMock);

          const bindCommentSpy = jest.spyOn(commentService, 'bindUserToComment').mockResolvedValue([
            {
              id: 1,
              parentId: null,
              postId: 1,
              content: 'hello',
              createdBy: 1,
              updatedBy: 1,
              giphyId: null,
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
              giphyId: null,
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

          const response = await commentService.getComments(
            {
              idGT: '1',
              postId: createdComment.postId,
            },
            authUserMock
          );

          expect(logSpy).toBeCalled();

          expect(bindCommentSpy).toBeCalled();

          expect(classTransformer).toBeCalled();

          expect(response).toBeInstanceOf(PageDto);

          expect(response.list[0]).toBeInstanceOf(CommentResponseDto);

          expect(response.list[0]).toEqual(expectResponse[0]);
        } catch (e) {
          throw e;
        }
      });
    });

    describe.skip('Get comments with idGTE', () => {
      it('should make condition query with Op.gte', async () => {
        // commentModel.findAll.mockReturnThis();
        try {
          await commentService.getComments(
            {
              idGTE: '1',
              postId: '10dc4093-1bd0-4105-869f-8504e1986145',
            },
            authUserMock
          );
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAll.mock.calls[0][0]['where'];
          expect({ postId: whereClause.postId, parentId: whereClause.parentId }).toEqual({
            postId: 1,
            parentId: 0,
          });
        }
      });
    });

    describe.skip('Get comments with idLT', () => {
      it('should make condition query with Op.lt', async () => {
        // commentModel.findAll.mockReturnThis();
        try {
          await commentService.getComments(
            {
              idLT: '1',
              postId: '10dc4093-1bd0-4105-869f-8504e1986145',
            },
            authUserMock
          );
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAll.mock.calls[0][0]['where'];
          expect({
            postId: whereClause.postId,
            parentId: whereClause.parentId,
            id: { [Op.not]: 1 },
          }).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.not]: 1 },
          });
        }
      });
    });

    describe.skip('Get comments with idLTE', () => {
      it('should make condition query with Op.lte', async () => {
        // commentModel.findAll.mockReturnThis();
        try {
          await commentService.getComments(
            {
              idLTE: '1',
              postId: '10dc4093-1bd0-4105-869f-8504e1986145',
            },
            authUserMock
          );
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAll.mock.calls[0][0]['where'];
          expect({ postId: whereClause.postId, parentId: whereClause.parentId }).toEqual({
            postId: 1,
            parentId: 0,
          });
        }
      });
    });

    describe.skip('Get comments with offset', () => {
      it('should make offset query', async () => {
        // commentModel.findAll.mockReturnThis();
        try {
          await commentService.getComments(
            {
              offset: 0,
              postId: '10dc4093-1bd0-4105-869f-8504e1986145',
            },
            authUserMock
          );
        } catch (e) {
          const offsetClause = commentModel.findAll.mock.calls[0][0]['offset'];
          expect(offsetClause).toBe(0);
        }
      });
    });
  });

  describe.skip('CommentService.getComment', () => {
    it('should return comment', async () => {
      const logSpy = jest.spyOn(commentService['_logger'], 'debug').mockReturnThis();

      commentModel.findOne.mockResolvedValue({
        ...getCommentRawMock,
        toJSON: () => getCommentRawMock,
      });

      reactionService.bindReactionToComments.mockResolvedValue(Promise.resolve());
      mentionService.bindToComment.mockResolvedValue(Promise.resolve());
      giphyService.bindUrlToComment.mockResolvedValue(Promise.resolve());
      commentService.bindChildrenToComment = jest.fn().mockResolvedValue(Promise.resolve());

      const bindUserToCommentSpy = jest
        .spyOn(commentService, 'bindUserToComment')
        .mockResolvedValue(Promise.resolve());

      const classTransformerSpy = jest
        .spyOn(commentService['_classTransformer'], 'plainToInstance')
        .mockImplementation(() => getCommentMock);
      const comment = await commentService.getComment(authUserMock, createdComment.id);

      expect(logSpy).toBeCalled();
      expect(commentModel.findOne).toBeCalled();
      expect(mentionService.bindToComment).toBeCalled();
      expect(bindUserToCommentSpy).toBeCalled();
      expect(classTransformerSpy).toBeCalled();
      expect(comment).toEqual(getCommentMock);
    });
  });

  describe.skip('CommentService._getComments', () => {
    it('Should be successfully', async () => {
      const spySequelizeConnectionQuery = jest
        .spyOn(sequelizeConnection, 'query')
        .mockResolvedValue([]);
      await commentService['_getComments'](
        {
          postId: '999c4093-1bd0-4105-869f-8504e1986145',
          idGT: '1',
        },
        authUserMock.id
      );
      expect(spySequelizeConnectionQuery).toBeCalled();
    });
  });

  describe('CommentService.getCommentsArroundIdForWeb', () => {
    it('Should be successfully', async () => {
      commentModel.findByPk.mockResolvedValue(getCommentMock);
      postService.findPost.mockResolvedValue({
        id: 1,
        groups: [
          {
            groupId: 1,
            postId: 1,
          },
        ],
      });
      postService.getEntityIdsReportedByUser.mockResolvedValue([]);
      commentService.bindChildrenToComment = jest.fn();
      jest.spyOn(commentService as any, '_getComments').mockResolvedValue({ list: [] });
      await commentService.getCommentsArroundId('57dc4093-1bd0-4105-869f-8504e1986145', authUserMock, {});
      expect(commentModel.findByPk).toBeCalled();
      expect(postService.findPost).toBeCalled();
    });
  });

  describe.skip('CommentService.deleteCommentsByPost', () => {
    it('Should successfully', async () => {
      commentModel.findAll.mockResolvedValue([]);
      await commentService.deleteCommentsByPost(
        '10dc4093-1bd0-4105-869f-8504e1986115',
        new sequelizeConnection.transaction()
      );
      expect(commentModel.findAll).toBeCalled();
      expect(commentModel.destroy).toBeCalled();
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

  describe.skip('CommentService.bindChildrenToComment', () => {
    it('Should successfully', async () => {
      sequelizeConnection.query = jest.fn().mockResolvedValue([]);
      await commentService.bindChildrenToComment([createdComment], authUserMock.id);
      expect(sequelizeConnection.query).toBeCalled();
    });
  });
});
