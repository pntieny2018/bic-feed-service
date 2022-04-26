import { GetReactionDto } from '../dto/request';
import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';

@Injectable()
export class GetReactionPipe implements PipeTransform {
  public transform(getReactions: GetReactionDto): GetReactionDto {
    if (!getReactions.limit) {
      getReactions.limit = 25;
    }
    if (!getReactions.latestId) {
      getReactions.latestId = 0;
    }
    if (!getReactions.order) {
      getReactions.order = OrderEnum.ASC;
    }

    return getReactions;
  }
}
