import { GetSeriesDto } from '../dto/requests';
import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';

@Injectable()
export class GetSeriesPipe implements PipeTransform {
  public transform(getSeriesDto: GetSeriesDto): GetSeriesDto {
    if (!getSeriesDto.commentOrder) {
      getSeriesDto.commentOrder = OrderEnum.DESC;
    }
    if (!getSeriesDto.childCommentOrder) {
      getSeriesDto.childCommentOrder = OrderEnum.DESC;
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
