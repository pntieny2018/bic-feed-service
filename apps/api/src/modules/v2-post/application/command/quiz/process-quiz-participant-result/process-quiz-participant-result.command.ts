import { ICommand } from '@nestjs/cqrs';

export type ProcessQuizParticipantResultCommandPayload = {
  quizParticipantId: string;
};
export class ProcessQuizParticipantResultCommand implements ICommand {
  public constructor(public readonly payload: ProcessQuizParticipantResultCommandPayload) {}
}
