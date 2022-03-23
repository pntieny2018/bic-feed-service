import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityService } from '../authority.service';
import { GroupService } from '../../../shared/group';

describe('AuthorityService', () => {
  let service: AuthorityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorityService,
        {
          provide: GroupService,
          useValue: {
            isMemberOfSomeGroups: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthorityService>(AuthorityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
