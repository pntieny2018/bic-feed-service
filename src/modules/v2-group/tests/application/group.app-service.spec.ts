import { mockedUserAuth } from '../../../post/test/mocks/user.mock';
import { groupMock } from '../mocks/group.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { GroupApplicationService } from '../../application';

describe('FindTagsPaginationHandler', () => {
  let groupAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupApplicationService],
    }).compile();
    groupAppService = module.get<GroupApplicationService>(GroupApplicationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.skip('GroupService.getGroupIdAndChildIdsUserJoined', () => {
    const userMocked = {
      id: '7251dac7-5088-4a33-b900-d1b058edaf98',
      username: 'martine.baumbach',
      avatar: 'https://bein.group/baumbach.png',
      email: 'baumbach@tgm.vn',
      fullname: 'Martine Baumbach',
      groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
    };
    it('return list access', () => {
      const listAccess = groupAppService.getGroupIdAndChildIdsUserJoined(
        groupMock[0],
        mockedUserAuth
      );
      expect(listAccess).toEqual([]);
    });
    it('return list access group secret', () => {
      const listAccess = groupAppService.getGroupIdAndChildIdsUserJoined(
        groupMock[3],
        mockedUserAuth
      );
      expect(listAccess).toEqual([]);
    });
  });
});
