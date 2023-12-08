import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

export type RedisStoreModuleOptions = {
  clusterMode?: boolean;
  nodes?: ClusterNode[];
  redisOptions?: RedisOptions;
  redisContentOptions?: RedisOptions;
  clusterOptions?: ClusterOptions;
};

export interface IRedisStoreModuleOptionsFactory {
  createRedisStoreOptions(): Promise<RedisStoreModuleOptions> | RedisStoreModuleOptions;
}

export interface IRedisStoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<IRedisStoreModuleOptionsFactory>;
  useClass?: Type<IRedisStoreModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RedisStoreModuleOptions> | RedisStoreModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}
