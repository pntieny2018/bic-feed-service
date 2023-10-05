import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';

import { GetArticleDto } from '../dto/requests';

@Injectable()
export class GetPostPipe implements PipeTransform {
  public transform(getArticleDto: GetArticleDto): GetArticleDto {
    if (!getArticleDto.commentOrder) {
      getArticleDto.commentOrder = ORDER.DESC;
    }
    if (!getArticleDto.childCommentOrder) {
      getArticleDto.childCommentOrder = ORDER.DESC;
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
