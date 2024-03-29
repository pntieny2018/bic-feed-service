import { GetCommentsDto } from '../dto/requests';
import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';
import { NIL as NIL_UUID } from 'uuid';

@Injectable()
export class GetCommentsPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentsDto): GetCommentsDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = 25;
    }
    if (!getCommentDto.order) {
      getCommentDto.order = OrderEnum.DESC;
    }
    if (!getCommentDto.childOrder) {
      getCommentDto.childOrder = OrderEnum.DESC;
    }
    if (!getCommentDto.childLimit) {
      getCommentDto.childLimit = 0;
    }
    if (!getCommentDto.parentId) {
      getCommentDto.parentId = NIL_UUID;
    }

    return getCommentDto;
  }
}
