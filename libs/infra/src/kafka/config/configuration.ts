import { IKafkaConfig, getKafkaConfig } from '@libs/infra/kafka';

interface IConfiguration {
  kafka: IKafkaConfig;
}

export const configs = (): IConfiguration => ({
  kafka: getKafkaConfig(),
});
