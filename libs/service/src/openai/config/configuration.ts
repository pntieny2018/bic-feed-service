import { IOpenAIConfig, getOpenAIConfig } from '@libs/service/openai';

interface IConfiguration {
  openai: IOpenAIConfig;
}

export const configs = (): IConfiguration => ({
  openai: getOpenAIConfig(),
});
