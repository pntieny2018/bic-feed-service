import { Cluster, ClusterNode, ClusterOptions } from 'ioredis';

export class RedisClusterStore {
  public static create(nodes: ClusterNode[], options?: ClusterOptions): Cluster {
    return new Cluster(nodes, options);
  }
}
