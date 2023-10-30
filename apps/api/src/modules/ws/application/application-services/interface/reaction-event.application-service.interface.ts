import { ReactionObjectDto } from '../../dto';

export const REACTION_EVENT_APPLICATION_SERVICE = 'REACTION_EVENT_APPLICATION_SERVICE';

export type ReactionEventPayload = {
  recipients: string[];
  action: 'create' | 'delete';
  reaction: ReactionObjectDto;
};

export interface IReactionEventApplicationService {
  emitReactionToContentEvent(payload: ReactionEventPayload): Promise<void>;
  emitReactionToCommentEvent(payload: ReactionEventPayload): Promise<void>;
  emitReactionToChildCommenEvent(payload: ReactionEventPayload): Promise<void>;
}
