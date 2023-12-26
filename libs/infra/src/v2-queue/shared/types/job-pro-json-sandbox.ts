import { JobJsonSandbox } from 'bullmq';

export type JobProJsonSandbox = JobJsonSandbox & {
  gid?: string | number;
};
