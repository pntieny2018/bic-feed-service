import { ICommand } from '@nestjs/cqrs';

export type CreateQuizCommandPayload = {
  quizId: string;
};
export class ProcessGenerationQuizCommand implements ICommand {
  public constructor(public readonly payload: CreateQuizCommandPayload) {}
}
