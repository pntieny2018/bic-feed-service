import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';
import { ForbiddenException } from '@nestjs/common';
import { GroupPrivacy, GroupSharedDto } from '../../../shared/group/dto';
import { PostPrivacy } from '../../../database/models/post.model';
import { HTTP_STATUS_ID } from '../../../common/constants';

describe('AuthorityService', () => {
  let service: AuthorityService;
  let groupService;
  let caslAbility;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorityService,
        {
          provide: 'CaslAbility',
          useValue: {
            can: jest.fn()
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
    caslAbility = module.get('CaslAbility');
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

      await service.checkIsPublicPost({
        lang: '',
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
        privacy: PostPrivacy.PUBLIC,
        groups: [{ postId: '1', groupId: 2 }]
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
          createdBy: 0,
          id: '',
          isArticle: false,
          isDraft: false,
          isImportant: false,
          updatedBy: 0,
          views: 0,
          privacy: PostPrivacy.PRIVATE,
          groups: [{ postId: '1', groupId: 2 }]
        });
      } catch (e) {
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN)
      }
    });
  });

  describe('AuthorityService.checkCanReadPost', () => {
    it('', async () => {
      groupService.isMemberOfGroups.mockReturnValue(true);
      caslAbility.can.mockReturnValue(true)
      await service.checkCanCreatePost(userDtoMock, [1]);
      expect(groupService.isMemberOfGroups).toBeCalled();
      expect(caslAbility.can).toBeCalled();
    });
  });

  describe('AuthorityService.checkCanUpdatePost', () => {
    it('', async () => {
      caslAbility.can.mockReturnValue(true)
      groupService.isMemberOfSomeGroups.mockReturnValue(true);
      await service.checkCanUpdatePost(userDtoMock, [1]);
      expect(caslAbility.can).toBeCalled();
      expect(groupService.isMemberOfSomeGroups).toBeCalled();
    });
  });
});
