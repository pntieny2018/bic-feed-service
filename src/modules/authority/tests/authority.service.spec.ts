import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';
import { authUserMock } from '../../comment/tests/mocks/user.mock';
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
  describe('AuthorityService.checkCanReadPost', () => {
    describe('when user is valid', () => {
      it('next', async () => {
        const mockGroup: GroupSharedDto = {
          id: 1,
          name: 'group 1',
          icon: 'icon 1',
          privacy: GroupPrivacy.PRIVATE,
          child: {
            public: [2, 3],
            open: [],
            private: [],
            secret: []
          }
        };
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
          {
            groups: [
              {
                postId: 1,
                groupId: 1,
              },
            ],
          } as any
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
});
