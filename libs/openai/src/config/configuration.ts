import { getOpenAIConfig } from '@app/openai/config/openai.config';
import { IOpenAIConfig } from '@app/openai/config/openai-config.interface';

interface IConfiguration {
  openai: IOpenAIConfig;
}

export const configs = (): IConfiguration => ({
  openai: getOpenAIConfig(),
});
