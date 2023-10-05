import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ContentAccessDeniedException } from '../../../../domain/exception';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { QuizSummaryDto } from '../../../dto';

import { FindQuizSummaryQuery } from './find-quiz-summary.query';

@QueryHandler(FindQuizSummaryQuery)
export class FindQuizSummaryHandler implements IQueryHandler<FindQuizSummaryQuery, QuizSummaryDto> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepo: IQuizParticipantRepository
  ) {}

  public async execute(query: FindQuizSummaryQuery): Promise<QuizSummaryDto> {
    const { authUser, contentId } = query.payload;

    const contentEntity = await this._contentRepo.getContentById(contentId);

    if (!contentEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    const participants =
      await this._quizParticipantRepo.getQuizParticipantHighestScoreGroupByUserId(contentId);

    const totalParticipants = participants.length;
    const totalPass = participants.filter((participant) => participant.score === 100).length;
    const totalFail = totalParticipants - totalPass;

    return {
      contentId,
      participants: { total: totalParticipants, pass: totalPass, fail: totalFail },
    };
  }
}
