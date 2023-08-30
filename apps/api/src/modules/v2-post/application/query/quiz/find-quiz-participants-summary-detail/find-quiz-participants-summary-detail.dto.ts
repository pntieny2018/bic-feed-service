import { IPaginatedInfo, PaginatedResponse } from '../../../../../../common/dto/cusor-pagination';
import { QuizParticipantSummaryDetailDto } from '../../../dto';

export class FindQuizParticipantsSummaryDetailDto extends PaginatedResponse<QuizParticipantSummaryDetailDto> {
  public constructor(list: QuizParticipantSummaryDetailDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
