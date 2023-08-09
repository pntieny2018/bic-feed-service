import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { TestBed } from '@automock/jest';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(QueueService).compile();

    service = unit
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
