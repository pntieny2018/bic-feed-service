import { IEvent } from '@nestjs/cqrs';

export class PostPublishedEvent implements IEvent {
  public constructor(public readonly ) {}
}
