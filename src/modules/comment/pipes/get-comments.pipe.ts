import { GetCommentDto } from '../dto/requests';
import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';

@Injectable()
export class GetCommentsPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentDto): GetCommentDto {
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
      getCommentDto.childLimit = 10;
    }
    if (!getCommentDto.parentId) {
      getCommentDto.parentId = 0;
    }

    return getCommentDto;
  }
}
