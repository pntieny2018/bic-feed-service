export interface IElasticsearchConfig {
  node: string;
  namespace: string;
  username: string;
  password: string;
  tls: boolean;
  ca: string;
}
