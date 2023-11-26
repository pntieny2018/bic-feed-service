import { JobsProOptions } from './jobs-pro-options';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface FlowJobProBase<T> {
  name: string;
  queueName: string;
  data?: any;
  prefix?: string;
  opts?: Omit<T, 'repeat'>;
  children?: FlowChildJobPro[];
}
export type FlowChildJobPro = FlowJobProBase<Omit<JobsProOptions, 'parent'>>;
export type FlowJobPro = FlowJobProBase<JobsProOptions>;
