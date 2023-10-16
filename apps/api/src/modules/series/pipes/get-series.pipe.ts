import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';

import { GetSeriesDto } from '../dto/requests';

@Injectable()
export class GetSeriesPipe implements PipeTransform {
  public transform(getSeriesDto: GetSeriesDto): GetSeriesDto {
    if (!getSeriesDto.commentOrder) {
      getSeriesDto.commentOrder = ORDER.DESC;
    }
    if (!getSeriesDto.childCommentOrder) {
      getSeriesDto.childCommentOrder = ORDER.DESC;
    }

    if (!getSeriesDto.commentLimit) {
      getSeriesDto.commentLimit = 10;
    }

    if (!getSeriesDto.childCommentLimit) {
      getSeriesDto.childCommentLimit = 0;
    }

    if (!getSeriesDto.withComment) {
      getSeriesDto.withComment = false;
    }

    return getSeriesDto;
  }
}
