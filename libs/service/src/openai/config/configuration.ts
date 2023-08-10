import { IOpenAIConfig, getOpenAIConfig } from '@app/service/openai';

interface IConfiguration {
  openai: IOpenAIConfig;
}

export const configs = (): IConfiguration => ({
  openai: getOpenAIConfig(),
});
