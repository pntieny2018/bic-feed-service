import { Test, TestingModule } from '@nestjs/testing';
import { UserApplicationService } from '../../application';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../../../v2-group/domain/repositoty-interface/group.repository.interface';
import { createMock } from '@golevelup/ts-jest';
import { GroupRepository } from '../../../v2-group/driven-adapter/repository/group.repository';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositoty-interface/user.repository.interface';
import { UserRepository } from '../../driven-adapter/repository/user.repository';

describe('UserApplicationService', () => {
  let groupAppService;
  let repo: IGroupRepository;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApplicationService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: createMock<UserRepository>(),
        },
      ],
    }).compile();
    groupAppService = module.get<UserApplicationService>(UserApplicationService);
    repo = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UserApplicationService.findOne', () => {
    const userMocked = {
      id: '7251dac7-5088-4a33-b900-d1b058edaf98',
      username: 'martine.baumbach',
      avatar: 'https://bein.group/baumbach.png',
      email: 'baumbach@tgm.vn',
      fullname: 'Martine Baumbach',
      groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
    };
    it('Should', () => {
      expect(1).toBe(1);
    });
  });
});
