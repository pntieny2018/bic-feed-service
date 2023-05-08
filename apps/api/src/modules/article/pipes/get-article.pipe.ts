import { GetArticleDto } from '../dto/requests';
import { OrderEnum } from '../../../common/dto';
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GetPostPipe implements PipeTransform {
  public transform(getArticleDto: GetArticleDto): GetArticleDto {
    if (!getArticleDto.commentOrder) {
      getArticleDto.commentOrder = OrderEnum.DESC;
    }
    if (!getArticleDto.childCommentOrder) {
      getArticleDto.childCommentOrder = OrderEnum.DESC;
    }

    if (!getArticleDto.commentLimit) {
      getArticleDto.commentLimit = 10;
    }

    if (!getArticleDto.childCommentLimit) {
      getArticleDto.childCommentLimit = 0;
    }

    return getArticleDto;
  }
}
