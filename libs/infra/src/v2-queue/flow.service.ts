import { FlowOpts } from 'bullmq';

import { IFlowService, IFlowServiceConfig } from './interfaces';
import { FlowJobPro, FlowProducerPro } from './shared';

export class FlowService implements IFlowService {
  private _flowService: FlowProducerPro;

  public constructor(private readonly _config: IFlowServiceConfig) {
    const { flowConfig } = this._config;
    this._flowService = new FlowProducerPro(flowConfig);
  }

  public async add(flow: FlowJobPro, opts?: FlowOpts): Promise<void> {
    await this._flowService.add(flow, opts);
  }
}
