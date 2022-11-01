import { PostService } from '../post.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PostConsumerController } from '../post-consummer.controller';
import { PostPrivacy } from '../../../database/models/post.model';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
jest.mock('../post.service')
describe('PostConsumerController', () => {
  let postService: PostService;
  let internalPostController: PostConsumerController;


  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostConsumerController],
      providers: [
        {
          provide: PostService,
          useClass: jest.fn(),
        },
        {
          provide: InternalEventEmitterService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();
    internalPostController = moduleRef.get<PostConsumerController>(PostConsumerController);
    postService = moduleRef.get<PostService>(PostService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('privacyUpdate', () => {
    it('should done', async () => {
      postService.findIdsByGroupId = jest.fn().mockResolvedValue([1,2])
      postService.updateData = jest.fn().mockResolvedValue([1,2])

      postService.filterPostIdsNeedToUpdatePrivacy = jest.fn().mockResolvedValue({[PostPrivacy.PRIVATE.toString()]: ['8c846fe3-a615-42ae-958a-33a43d24a033']})
      await internalPostController.privacyUpdate({privacy: PostPrivacy.SECRET, groupId: '8c846fe3-a615-42ae-958a-33a43d24a033'})
    })
  })
})
