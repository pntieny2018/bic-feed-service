import { ContentProcessor, QuizParticipantProcessor, QuizPendingProcessor } from '../processors';

export const QUIZ_PENDING_PROCESSOR_TOKEN = 'QUIZ_PENDING_PROCESSOR_TOKEN';
export const CONTENT_SCHEDULED_PROCESSOR_TOKEN = 'CONTENT_SCHEDULED_PROCESSOR_TOKEN';
export const QUIZ_PARTICIPANT_PROCESSOR_TOKEN = 'QUIZ_PARTICIPANT_PROCESSOR_TOKEN';

export const processorProvider = [ContentProcessor, QuizPendingProcessor, QuizParticipantProcessor];
