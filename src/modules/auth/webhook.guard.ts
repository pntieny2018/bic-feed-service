import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class WebhookGuard implements CanActivate {
  protected readonly secretObject = {
    key: 'secret',
    value: '$2a$12$dvgazpG5VPUxPNQBQcIJUe2hZSorX816Wa6gKJMCcQKvk9BzQG66e',
  };

  public canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const { headers } = request;
    const serviceKey = headers[this.secretObject.key] as string;
    return serviceKey === this.secretObject.value;
  }
}
