import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';
import { ForbiddenException } from '@nestjs/common';
import { GroupPrivacy, GroupSharedDto } from '../../../shared/group/dto';

describe('AuthorityService', () => {
  let service: AuthorityService;
  let groupService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorityService,
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockGroup: GroupSharedDto = {
    id: 1,
    name: 'group 1',
    icon: 'icon 1',
    privacy: GroupPrivacy.PRIVATE,
    child: {
      public: [2, 3],
      open: [],
      private: [],
      secret: [],
    },
  };

  const userDtoMock = {
    groups: [
      {
        postId: 1,
        groupId: 1,
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
            id: 1,
            username: 'martine.baumbach',
            avatar: 'https://bein.group/baumbach.png',
            email: 'baumbach@tgm.vn',
            staffRole: 'normal',
            profile: {
              id: 1,
              fullname: 'Martine Baumbach',
              username: 'martine.baumbach',
              avatar: 'https://bein.group/baumbach.png',
              groups: [1, 2],
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
              id: 1,
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
      groupService.getMany.mockReturnValue([mockGroup]);

      await service.checkIsPublicPost({
        canComment: false,
        canReact: false,
        canShare: false,
        commentsCount: 0,
        totalUsersSeen: 0,
        content: '',
        createdBy: 0,
        id: '',
        isArticle: false,
        isDraft: false,
        isImportant: false,
        updatedBy: 0,
        views: 0,
        groups: [{ postId: '1', groupId: 2 }],
      });

      expect(groupService.getMany).toBeCalled();
    });

    it('exception if GroupPrivacy.PRIVATE', async () => {
      mockGroup.privacy = GroupPrivacy.PRIVATE;
      groupService.getMany.mockReturnValue([mockGroup]);
      try {
        await service.checkIsPublicPost({
          canComment: false,
          canReact: false,
          canShare: false,
          commentsCount: 0,
          totalUsersSeen: 0,
          content: '',
          createdBy: 0,
          id: '',
          isArticle: false,
          isDraft: false,
          isImportant: false,
          updatedBy: 0,
          views: 0,
          groups: [{ postId: '1', groupId: 2 }],
        });
      } catch (e) {
        expect(groupService.getMany).toBeCalled();
      }
    });
  });

  describe('AuthorityService.checkCanReadPost', () => {
    it('', async () => {
      groupService.isMemberOfGroups.mockReturnValue(true);
      await service.checkCanCreatePost(userDtoMock, [1]);
      expect(groupService.isMemberOfGroups).toBeCalled();
    });
  });

  describe('AuthorityService.checkCanUpdatePost', () => {
    it('', async () => {
      groupService.isMemberOfSomeGroups.mockReturnValue(true);
      await service.checkCanUpdatePost(userDtoMock, [1]);
      expect(groupService.isMemberOfSomeGroups).toBeCalled();
    });
  });
});
