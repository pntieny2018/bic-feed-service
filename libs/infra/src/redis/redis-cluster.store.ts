import Redis, { ClusterNode, ClusterOptions } from 'ioredis';

export class RedisClusterStore {
  public static create(nodes: ClusterNode[], options?: ClusterOptions): Redis.Cluster {
    return new Redis.Cluster(nodes, options);
  }
}
