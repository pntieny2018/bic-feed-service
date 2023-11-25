import { QUIZ_RESULT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ArrayHelper } from '../../../../../../common/helpers';
import { ContentAccessDeniedException } from '../../../../domain/exception';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import { QuizParticipantSummaryDetailDto } from '../../../dto';

import { FindQuizParticipantsSummaryDetailDto } from './find-quiz-participants-summary-detail.dto';
import { FindQuizParticipantsSummaryDetailQuery } from './find-quiz-participants-summary-detail.query';

@QueryHandler(FindQuizParticipantsSummaryDetailQuery)
export class FindQuizParticipantsSummaryDetailHandler
  implements
    IQueryHandler<FindQuizParticipantsSummaryDetailQuery, FindQuizParticipantsSummaryDetailDto>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepo: IQuizParticipantRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(
    query: FindQuizParticipantsSummaryDetailQuery
  ): Promise<FindQuizParticipantsSummaryDetailDto> {
    const { authUser, contentId, limit, before, after, order } = query.payload;

    const contentEntity = await this._contentRepo.getContentById(contentId);

    if (!contentEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    const { rows: quizParticipantEntities, meta } =
      await this._quizParticipantRepo.getPaginationQuizParticipantHighestScoreGroupByUserId(
        contentId,
        { limit, before, after, order }
      );

    const userIds = quizParticipantEntities.map((quizParticipantEntity) =>
      quizParticipantEntity.get('createdBy')
    );
    const users = await this._userAdapter.getUsersByIds(userIds);
    const userMap = ArrayHelper.convertArrayToObject(users, 'id');

    const quizParticipantSummaryDetails: QuizParticipantSummaryDetailDto[] =
      quizParticipantEntities.map((quizParticipantDto) => ({
        id: quizParticipantDto.get('id'),
        quizId: quizParticipantDto.get('quizId'),
        createdAt: quizParticipantDto.get('createdAt'),
        score: quizParticipantDto.get('score'),
        status:
          quizParticipantDto.get('score') === 100
            ? QUIZ_RESULT_STATUS.PASS
            : QUIZ_RESULT_STATUS.FAIL,
        actor: userMap[quizParticipantDto.get('createdBy')],
      }));

    return { list: quizParticipantSummaryDetails, meta };
  }
}
