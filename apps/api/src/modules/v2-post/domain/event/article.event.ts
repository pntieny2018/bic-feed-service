import { UserDto } from '../../../v2-user/application';
import { ArticleEntity } from '../model/content';

export class ArticleDeletedEvent {
  public constructor(
    public readonly articleEntity: ArticleEntity,
    public readonly actor: UserDto
  ) {}
}

export class ArticleUpdatedEvent {
  public constructor(
    public readonly articleEntityBefore: ArticleEntity,
    public readonly articleEntityAfter: ArticleEntity,
    public readonly actor: UserDto
  ) {}
}

export class ArticlePublishedEvent {
  public constructor(
    public readonly articleEntity: ArticleEntity,
    public readonly actor: UserDto
  ) {}
}
