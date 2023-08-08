import { IKafkaConfig, getKafkaConfig } from '@app/infra/kafka';

interface IConfiguration {
  kafka: IKafkaConfig;
}

export const configs = (): IConfiguration => ({
  kafka: getKafkaConfig(),
});
