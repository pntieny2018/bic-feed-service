import { FlowOpts, QueueBaseOptions } from 'bullmq';

import { FlowJobPro } from '../shared';

export interface IQueueFlowServiceConfig {
  queueFlowConfig: QueueBaseOptions;
}

export interface IQueueFlowService {
  add(flow: FlowJobPro, opts?: FlowOpts): Promise<void>;
}
