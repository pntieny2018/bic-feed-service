import { IKafkaConfig } from '@app/kafka';
import { getKafkaConfig } from '@app/kafka/config/kafka.config';

interface IConfiguration {
  kafka: IKafkaConfig;
}

export const configs = (): IConfiguration => ({
  kafka: getKafkaConfig(),
});
