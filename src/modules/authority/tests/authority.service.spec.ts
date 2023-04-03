import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';
import { ForbiddenException } from '@nestjs/common';
import { GroupPrivacy, GroupSharedDto } from '../../../shared/group/dto';
import { PostPrivacy, PostStatus, PostType } from '../../../database/models/post.model';
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
            createForUser: jest.fn(),
          },
        },
        {
          provide: GroupService,
          useValue: {
            getMany: jest.fn(),
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
      closed: ['54366eb1-b428-4265-a71b-1b923a311506', '55a19f0a-4209-4fbd-8c44-f1c2fd350b10'],
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
  describe('AuthorityService.checkIsPublicPost', () => {
    it('pass if GroupPrivacy.OPEN', async () => {
      mockGroup.privacy = GroupPrivacy.OPEN;

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
        status: PostStatus.PUBLISHED,
        isImportant: false,
        updatedBy: '00000000-0000-0000-0000-000000000000',
        privacy: PostPrivacy.OPEN,
        groups: [
          {
            postId: 'a0ceb67b-1cf9-4f10-aa60-3ee647301712',
            groupId: '54366eb1-b428-4265-a71b-1b923a311506',
          },
        ],
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
          status: PostStatus.PUBLISHED,
          isImportant: false,
          updatedBy: '00000000-0000-0000-0000-000000000000',
          privacy: PostPrivacy.PRIVATE,
          groups: [
            {
              postId: 'a0ceb67b-1cf9-4f10-aa60-3ee647301712',
              groupId: '54366eb1-b428-4265-a71b-1b923a311506',
            },
          ],
        });
      } catch (e) {
        expect(e.message).toEqual(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    });
  });

  const ability = {
    can: jest.fn(),
  };
  describe('AuthorityService.checkCanUpdatePost', () => {
    it('', async () => {
      groupService.getMany.mockResolvedValue([{ id: 1, name: 'BIC to the moon' }]);
      authorityFactory.createForUser.mockResolvedValue(ability);
      ability.can.mockResolvedValue(true);
      await service.checkCanUpdatePost(
        userDtoMock,
        ['a0ceb67b-1cf9-4f10-aa60-3ee6473017a3'],
        false
      );
      expect(groupService.getMany).toBeCalled();
      expect(authorityFactory.createForUser).toBeCalled();
      expect(ability.can).toBeCalled();
    });
  });
});
