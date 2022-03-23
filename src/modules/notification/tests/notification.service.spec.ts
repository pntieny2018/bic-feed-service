import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER } from '../producer.constants';

describe('NotificationService', () => {
  let service: NotificationService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: COMMENT_PRODUCER,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: POST_PRODUCER,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: REACTION_PRODUCER,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
