import {GetSeriesDto, OrderFields} from '../dto/requests';
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GetSeriesPipe implements PipeTransform {
  public transform(getSeriesDto: GetSeriesDto): GetSeriesDto {
    if (!getSeriesDto.limit) {
      getSeriesDto.limit = 10;
    }

    if (!getSeriesDto.offset) {
      getSeriesDto.offset = 0;
    }

    if (!getSeriesDto.orderField) {
      getSeriesDto.orderField = OrderFields[0]; // default if empty
    }

    if (!OrderFields.includes(getSeriesDto.orderField)) {
      getSeriesDto.orderField = OrderFields[0]; // default if wrong param
    }

    return getSeriesDto;
  }
}
