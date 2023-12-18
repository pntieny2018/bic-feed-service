import { FlowOpts } from 'bullmq';

import { IQueueFlowService, IQueueFlowServiceConfig } from './interfaces';
import { FlowJobPro, FlowProducerPro } from './shared';

export class QueueFlowService implements IQueueFlowService {
  private _queueFlow: FlowProducerPro;

  public constructor(private readonly _config: IQueueFlowServiceConfig) {
    const { queueFlowConfig } = this._config;
    this._queueFlow = new FlowProducerPro(queueFlowConfig);
  }

  public async add(flow: FlowJobPro, opts?: FlowOpts): Promise<void> {
    await this._queueFlow.add(flow, opts);
  }
}
