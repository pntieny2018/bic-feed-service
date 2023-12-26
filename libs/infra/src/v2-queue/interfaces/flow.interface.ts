import { FlowOpts, QueueBaseOptions } from 'bullmq';

import { JobsProOptions } from '../shared';

export interface IFlowServiceConfig {
  flowConfig: QueueBaseOptions;
}

export interface IFlowJobWithConfiguration<T, U> {
  name: string;
  queueName: string;
  data?: T;
  opts?: Omit<JobsProOptions, 'repeat'>;
  children?: IFlowJobWithConfiguration<U, T>[];
}

export interface IFlowService {
  add<T, U>(flow: IFlowJobWithConfiguration<T, U>, opts?: FlowOpts): Promise<void>;
}
