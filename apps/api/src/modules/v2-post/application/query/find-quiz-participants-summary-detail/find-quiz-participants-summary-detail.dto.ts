import { QuizParticipantSummaryDetailDto } from '../../dto';
import { IPaginatedInfo, PaginatedResponse } from '../../../../../common/dto/cusor-pagination';

export class FindQuizParticipantsSummaryDetailDto extends PaginatedResponse<QuizParticipantSummaryDetailDto> {
  public constructor(list: QuizParticipantSummaryDetailDto[], meta?: IPaginatedInfo) {
    super(list, meta);
  }
}
