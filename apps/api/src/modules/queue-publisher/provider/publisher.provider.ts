import {
  ContentScheduledPublisher,
  QuizPendingPublisher,
  QuizParticipantPublisher,
} from '../driven-adapter/infra';

export const CONTENT_SCHEDULED_PUBLISHER_TOKEN = 'CONTENT_SCHEDULED_PUBLISHER_TOKEN';
export const QUIZ_PENDING_PUBLISHER_TOKEN = 'QUIZ_PENDING_PUBLISHER_TOKEN';
export const QUIZ_PARTICIPANT_PUBLISHER_TOKEN = 'QUIZ_PARTICIPANT_PUBLISHER_TOKEN';

export const publisherProvider = [
  ContentScheduledPublisher,
  QuizPendingPublisher,
  QuizParticipantPublisher,
];
