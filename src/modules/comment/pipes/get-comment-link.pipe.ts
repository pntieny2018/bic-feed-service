import { GetCommentsDto } from '../dto/requests';
import { Injectable, PipeTransform } from '@nestjs/common';
import { OrderEnum } from '../../../common/dto';
import { NIL as NIL_UUID } from 'uuid';
import { GetCommentLinkDto } from '../dto/requests/get-comment-link.dto';

@Injectable()
export class GetCommentLinkPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentLinkDto): GetCommentLinkDto {
    if (!getCommentDto.targetChildLimit) {
      getCommentDto.targetChildLimit = 10;
    }
    if (!getCommentDto.childLimit) {
      getCommentDto.childLimit = 10;
    }
    if (!getCommentDto.limit) {
      getCommentDto.limit = 10;
    }

    return getCommentDto;
  }
}
