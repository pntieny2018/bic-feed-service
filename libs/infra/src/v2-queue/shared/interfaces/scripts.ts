import { JobData } from 'bullmq';

import { WorkerPro } from '../classes';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Scripts<T, R, N extends string> {
  moveToActive(worker: WorkerPro<T, R, N>, token: string, jobId?: string): Promise<[] | JobData>;
}
