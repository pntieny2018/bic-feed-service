import { IElasticsearchConfig } from './elasticsearch-config.interface';

export const getElasticsearchConfig = (): IElasticsearchConfig => ({
  namespace: process.env.ELASTICSEARCH_NAMESPACE,
  node: process.env.ELASTICSEARCH_NODE,
  username: process.env.ELASTICSEARCH_USERNAME,
  password: process.env.ELASTICSEARCH_PASSWORD,
  tls: process.env.ELASTICSEARCH_TLS === 'false' ? false : true,
  ca: process.env.ELASTICSEARCH_CA,
});
