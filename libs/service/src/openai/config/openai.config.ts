import { IOpenAIConfig } from '@libs/service/openai';

export const getOpenAIConfig = (): IOpenAIConfig => ({
  apiKey: process.env.OPENAI_API_KEY,
});
