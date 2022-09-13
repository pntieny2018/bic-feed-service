import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from '../follow.controller';
import { FollowService } from '../follow.service';
import { getUserFollowDtoMock } from './mocks/get-user-follow-dto.mock';

describe('FollowController', () => {
  let controller: FollowController;
  let followServices;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [
        {
          provide: FollowService,
          useValue: {
            follow: jest.fn(),
            unfollow: jest.fn(),
            gets: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FollowController>(FollowController);
    followServices = module.get<FollowService>(FollowService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('FollowController.getss', () => {
    it('should gets be called', async () => {
      await controller.gets(getUserFollowDtoMock)
      expect(followServices.gets).toBeCalled();
    })
  })
});
