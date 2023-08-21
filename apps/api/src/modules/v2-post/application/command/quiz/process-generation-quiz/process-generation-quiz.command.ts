import { ICommand } from '@nestjs/cqrs';

export type ProcessGenerationQuizCommandPayload = {
  quizId: string;
};
export class ProcessGenerationQuizCommand implements ICommand {
  public constructor(public readonly payload: ProcessGenerationQuizCommandPayload) {}
}
