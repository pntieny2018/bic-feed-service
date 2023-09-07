import { GenerateQuestionProps, GenerateQuestionResponse } from '@libs/service/openai';

export const OPENAI_ADAPTER = 'OPENAI_ADAPTER';

export interface IOpenAIAdapter {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse>;
}
