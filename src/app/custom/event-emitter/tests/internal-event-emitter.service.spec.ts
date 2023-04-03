import { Test, TestingModule } from '@nestjs/testing';
import { InternalEventEmitterService } from '../internal-event-emitter.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('InternalEventEmitterService', () => {
  let service: InternalEventEmitterService;
  let eventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalEventEmitterService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn().mockReturnThis(),
          },
        },
      ],
    }).compile();

    service = module.get<InternalEventEmitterService>(InternalEventEmitterService);
    eventEmitter2 = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('InternalEventEmitterService.emit', () => {
    it('should emit IEvent', () => {
      const eventName = 'event.name';

      service.emit({
        payload: null,
        getEventName: () => eventName,
      });
      const params = eventEmitter2.emit.mock.calls[0][0];
      expect(params).toEqual(eventName);
    });
  });
});
