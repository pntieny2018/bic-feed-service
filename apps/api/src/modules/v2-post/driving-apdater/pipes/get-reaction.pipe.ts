import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';

import { GetReactionRequestDto } from '../dto/request';

@Injectable()
export class GetReactionPipe implements PipeTransform {
  public transform(getReactionDto: GetReactionRequestDto): GetReactionRequestDto {
    if (!getReactionDto.latestId) {
      getReactionDto.latestId = NIL_UUID;
    }
    if (!getReactionDto.limit) {
      getReactionDto.limit = 25;
    }
    if (!getReactionDto.order || getReactionDto.order) {
      getReactionDto.order = ORDER.DESC;
    }

    return getReactionDto;
  }
}
