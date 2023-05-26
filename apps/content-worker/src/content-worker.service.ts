import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentWorkerService {
  getHello(): string {
    return 'Hello World!';
  }
}
