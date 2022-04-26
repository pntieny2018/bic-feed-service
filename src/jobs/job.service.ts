import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class JobService implements OnModuleDestroy {
  public onModuleDestroy(): any {
    if (global.DynamicQueues) {
      global.DynamicQueues = null;
    }
  }
}
