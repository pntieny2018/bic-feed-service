import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';
import { GetReactionDto } from '../dto/request';
import { NIL as NIL_UUID } from 'uuid';

@Injectable()
export class GetReactionPipe implements PipeTransform {
  public transform(getReactionDto: GetReactionDto): GetReactionDto {
    if (!getReactionDto.latestId) {
      getReactionDto.latestId = NIL_UUID;
    }
    if (!getReactionDto.limit) {
      getReactionDto.limit = 25;
    }
    if (!getReactionDto.order || getReactionDto.order) {
      getReactionDto.order = OrderEnum.DESC;
    }

    return getReactionDto;
  }
}
