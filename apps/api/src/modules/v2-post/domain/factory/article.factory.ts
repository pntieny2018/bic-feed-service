import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IArticleFactory } from './interface';
import { ArticleEntity, ArticleProps } from '../model/post/article.entity';

export class ArticleFactory implements IArticleFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public reconstitute(properties: ArticleProps): ArticleEntity {
    return this._eventPublisher.mergeObjectContext(new ArticleEntity(properties));
  }
}
