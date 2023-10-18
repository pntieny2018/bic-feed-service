import { IPaginatedInfo, PaginatedResponse } from '@libs/database/postgres/common';

import { QuizParticipantSummaryDetailDto } from '../../../dto';

export class FindQuizParticipantsSummaryDetailDto extends PaginatedResponse<QuizParticipantSummaryDetailDto> {
  public constructor(list: QuizParticipantSummaryDetailDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
