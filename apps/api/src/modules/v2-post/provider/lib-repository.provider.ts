import { LibContentRepository } from '@libs/database/postgres/repository/content.repository';
import { LibQuizParticipantRepository } from '@libs/database/postgres/repository/quiz-participant.repository';
import { LibQuizRepository } from '@libs/database/postgres/repository/quiz.repository';
import {
  LibPostCategoryRepository,
  LibPostGroupRepository,
  LibPostSeriesRepository,
  LibPostTagRepository,
  LibQuizAnswerRepository,
  LibQuizQuestionRepository,
  LibUserMarkReadPostRepository,
  LibUserReportContentRepository,
  LibUserSavePostRepository,
  LibUserSeenPostRepository,
} from '@libs/database/postgres/repository';
import { LibQuizParticipantAnswerRepository } from '@libs/database/postgres/repository/quiz-participant-answer.repository';

export const libRepositoryProvider = [
  LibContentRepository,
  LibPostGroupRepository,
  LibPostSeriesRepository,
  LibPostCategoryRepository,
  LibPostTagRepository,
  LibUserSeenPostRepository,
  LibUserMarkReadPostRepository,
  LibUserReportContentRepository,
  LibUserSavePostRepository,
  LibQuizRepository,
  LibQuizParticipantRepository,
  LibQuizParticipantAnswerRepository,
  LibQuizQuestionRepository,
  LibQuizAnswerRepository,
];
