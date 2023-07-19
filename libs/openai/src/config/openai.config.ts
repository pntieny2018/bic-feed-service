import { IOpenAIConfig } from '@app/openai/config/openai-config.interface';

export const getOpenAIConfig = (): IOpenAIConfig => ({
  apiKey: process.env.OPENAI_API_KEY,
});
