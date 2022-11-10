import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';
import { ForbiddenException, Post } from '@nestjs/common';
import { GroupPrivacy, GroupSharedDto } from '../../../shared/group/dto';
import { PostPrivacy, PostType } from '../../../database/models/post.model';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { AuthorityFactory } from '../authority.factory';

describe.skip('AuthorityService', () => {
  let service: AuthorityService;
  let groupService;
  let authorityFactory;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorityService,
        {
          provide: AuthorityFactory,
          useValue: {
            createForUser: jest.fn()
          },
        },
        {
          provide: GroupService,
          useValue: {
            getMany: jest.fn(),
            isMemberOfSomeGroups: jest.fn(),
            isMemberOfGroups: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthorityService>(AuthorityService);
    groupService = module.get<GroupService>(GroupService);
    authorityFactory = module.get<AuthorityFactory>(AuthorityFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockGroup: GroupSharedDto = {
    id: 'a0ceb67b-1cf9-4f10-aa60-3ee6473017a3',
    name: 'group 1',
    icon: 'icon 1',
    privacy: GroupPrivacy.PRIVATE,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    child: {
      public: ['54366eb1-b428-4265-a71b-1b923a311506', '55a19f0a-4209-4fbd-8c44-f1c2fd350b10'],
      open: [],
      private: [],
      secret: [],
    },
  };

  const userDtoMock = {
    id: '853ab699-ee44-42ab-b98d-d190c4af66ee',
    groups: [
      {
        postId: '79455b8f-0aad-4745-83db-9fe2ee4e1a09',
        groupId: 'a0ceb67b-1cf9-4f10-aa60-3ee6473017a3',
      },
    ],
  } as any;
  describe('AuthorityService.checkCanReadPost', () => {
    describe('when user is valid', () => {
      it('next', async () => {
        groupService.getMany.mockReturnValue([mockGroup]);
        groupService.isMemberOfSomeGroups.mockReturnValue(true);
        await service.checkCanReadPost(
          {
            id: '853ab699-ee44-42ab-b98d-d190c4af66ee',
            username: 'martine.baumbach',
            avatar: 'https://bein.group/baumbach.png',
            email: 'baumbach@tgm.vn',
            staffRole: 'normal',
            profile: {
              id: '853ab699-ee44-42ab-b98d-d190c4af66ee',
              fullname: 'Martine Baumbach',
              username: 'martine.baumbach',
              avatar: 'https://bein.group/baumbach.png',
              groups: ['a0ceb67b-1cf9-4f10-aa60-3ee6473017a3', '54366eb1-b428-4265-a71b-1b923a311506'],
            },
          },
          userDtoMock
        );
        expect(groupService.isMemberOfSomeGroups).toBeCalled();
      });
    });
    describe('when user is invalid', () => {
      it('should throw ForbiddenException', () => {
        try {
          groupService.isMemberOfSomeGroups.mockReturnValue(false);
          service.checkCanReadPost(
            {
              id: '853ab699-ee44-42ab-b98d-d190c4af66ee',
              username: 'martine.baumbach',
              avatar: 'https://bein.group/baumbach.png',
              email: 'baumbach@tgm.vn',
              staffRole: 'normal',
            },
            {
              groups: null,
            } as any
          );
        } catch (e) {
          expect(e).toBeInstanceOf(ForbiddenException);
          expect((e as ForbiddenException).message).toEqual(
            'You do not have permission to perform this action !'
          );
        }
      });
    });
  });

  describe('AuthorityService.checkIsPublicPost', () => {
    it('pass if GroupPrivacy.PUBLIC', async () => {
      mockGroup.privacy = GroupPrivacy.PUBLIC;

      await service.checkIsPublicPost({
        lang: '',
        canComment: false,
        canReact: false,
        canShare: false,
        commentsCount: 0,
        totalUsersSeen: 0,
        content: '',
        createdBy: '00000000-0000-0000-0000-000000000000',
        id: '',
        type: PostType.POST,
        isDraft: false,
        isImportant: false,
        updatedBy: '00000000-0000-0000-0000-000000000000',
        views: 0,
        privacy: PostPrivacy.PUBLIC,
        groups: [{ postId: 'a0ceb67b-1cf9-4f10-aa60-3ee647301712', groupId: '54366eb1-b428-4265-a71b-1b923a311506' }]
      });
    });

    it('exception if GroupPrivacy.PRIVATE', async () => {
      mockGroup.privacy = GroupPrivacy.PRIVATE;
      try {
        await service.checkIsPublicPost({
          lang: '',
          canComment: false,
          canReact: false,
          canShare: false,
          commentsCount: 0,
          totalUsersSeen: 0,
          content: '',
          createdBy: '00000000-0000-0000-0000-000000000000',
          id: '',
          type: PostType.POST,
          isDraft: false,
          isImportant: false,
          updatedBy: '00000000-0000-0000-0000-000000000000',
          views: 0,
          privacy: PostPrivacy.PRIVATE,
          groups: [{ postId: 'a0ceb67b-1cf9-4f10-aa60-3ee647301712', groupId: '54366eb1-b428-4265-a71b-1b923a311506' }]
        });
      } catch (e) {
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN)
      }
    });
  });

  const ability = {
    can: jest.fn()
  }
  describe('AuthorityService.checkCanReadPost', () => {
    it('', async () => {
      groupService.isMemberOfGroups.mockReturnValue(true);
      groupService.getMany.mockResolvedValue([{id: 1, name: 'BIC to the moon'}])
      authorityFactory.createForUser.mockResolvedValue(ability)
      ability.can.mockResolvedValue(true)
      await service.checkCanCreatePost(userDtoMock, ['a0ceb67b-1cf9-4f10-aa60-3ee6473017a3']);
      expect(groupService.isMemberOfGroups).toBeCalled();
      expect(groupService.getMany).toBeCalled();
      expect(authorityFactory.createForUser).toBeCalled();
      expect(ability.can).toBeCalled();
    });
  });

  describe('AuthorityService.checkCanUpdatePost', () => {
    it('', async () => {
      groupService.isMemberOfSomeGroups.mockReturnValue(true);
      await service.checkCanUpdatePost(userDtoMock, {
        canComment: false,
        canReact: false,
        canShare: false,
        commentsCount: 0,
        content: '',
        createdBy: '853ab699-ee44-42ab-b98d-d190c4af66ee',
        id: '',
        type: PostType.POST,
        isDraft: false,
        isImportant: false,
        totalUsersSeen: 0,
        updatedBy: '00000000-0000-0000-0000-000000000000',
        views: 0
      }, ['a0ceb67b-1cf9-4f10-aa60-3ee6473017a3']);
      expect(groupService.isMemberOfSomeGroups).toBeCalled();
    });
  });
});
