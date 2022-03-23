import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from '../comment.service';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { MentionService } from '../../mention';
import { AuthorityService } from '../../authority';
import { PostPolicyService } from '../../post/post-policy.service';
import { Sequelize } from 'sequelize-typescript';
import { CommentModel } from '../../../database/models/comment.model';
import { getModelToken } from '@nestjs/sequelize';
import { authUserMock, authUserNotInGroupContainPostMock } from './mocks/user.mock';
import {
  createCommentWithPostNotFoundDto,
  createTextCommentDto,
  createTextCommentWithMentionNotInGroupDto,
} from './mocks/create-comment-dto.mock';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PostService } from '../../post/post.service';
import { MediaService } from '../../media';
import { LogicException } from '../../../common/exceptions';
import { MENTION_ERROR_ID } from '../../mention/errors/mention.error';
import { Op } from 'sequelize';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: MediaService,
          useValue: {
            sync: jest.fn(),
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
        { provide: Sequelize, useValue: { query: jest.fn(), transaction: jest.fn() } },
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
  });

  it('should be defined', () => {
    expect(commentService).toBeDefined();
  });

  describe('CommentService.create', () => {
    it('Post allow comment', async () => {});
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
            mentionService.checkValidMentions.mockRejectedValue(
              new LogicException(MENTION_ERROR_ID.USER_NOT_FOUND)
            );

            await commentService.create(authUserMock, createTextCommentWithMentionNotInGroupDto);
          } catch (e) {
            // expect(e).toBeInstanceOf(LogicException);
            // expect((e as LogicException).id).toEqual(MENTION_ERROR_ID.USER_NOT_FOUND);
          }
        });
      });
    });

    describe('Create comment with invalid media', () => {
      describe('media not exist', () => {});
      describe('is not owner of media', () => {});
    });
  });

  describe('CommentService.update', () => {
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
  });

  describe('CommentService.getComments', () => {
    describe('Get comments with idGT', () => {
      it('should make condition query with Op.gt', async () => {
        commentModel.findAndCountAll.mockReturnThis();
        try {
          await commentService.getComments(authUserMock, {
            idGT: 1,
            postId: 1,
          });
          //expect();
        } catch (e) {
          const whereClause = commentModel.findAndCountAll.mock.calls[0][0]['where'];

          expect(whereClause).toEqual({
            postId: 1,
            parentId: 0,
            id: { [Op.gt]: 1 },
          });
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

  describe('CommentService.bindUserToComment', () => {});
});
