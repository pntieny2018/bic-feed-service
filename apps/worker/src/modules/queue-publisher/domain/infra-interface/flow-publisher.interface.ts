import { JobWithConfiguration, QueueFlowName } from '@libs/infra/v2-queue';

export interface QueueFlowAdapters {
  flowName: QueueFlowName;
  serviceToken: string;
}
export interface IFlowPublisher {
  add<T>(job: JobWithConfiguration<T>): Promise<void>;
}
