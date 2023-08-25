import { getKafkaConfig } from './kafka.config';
import { IKafkaConfig } from './kafka.config.interface';

interface IConfiguration {
  kafka: IKafkaConfig;
}

export const configs = (): IConfiguration => ({
  kafka: getKafkaConfig(),
});
