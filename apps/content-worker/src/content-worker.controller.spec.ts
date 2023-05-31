import { Test, TestingModule } from '@nestjs/testing';
import { ContentWorkerController } from './content-worker.controller';
import { ContentWorkerService } from './content-worker.service';

describe('ContentWorkerController', () => {
  let contentWorkerController: ContentWorkerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ContentWorkerController],
      providers: [ContentWorkerService],
    }).compile();

    contentWorkerController = app.get<ContentWorkerController>(ContentWorkerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(contentWorkerController.getHello()).toBe('Hello World!');
    });
  });
});
