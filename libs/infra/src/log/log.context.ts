import { IUser } from '@libs/service/user/src/interfaces';
import { CLS_REQ, ClsServiceManager } from 'nestjs-cls';
import { v4 as uuid } from 'uuid';

export interface IContext {
  requestId: string;
  actor: IUser;
  event: string;
}

export const CONTEXT = Symbol('CONTEXT');
export const SYSTEM = 'SYSTEM';

export function getContext(where?: string): IContext {
  const cls = ClsServiceManager.getClsService();
  const context = cls.isActive() ? cls.get(CONTEXT) : null;

  if (context) {
    return context;
  } else {
    initTracingContext(where);
    return cls.get(CONTEXT);
  }
}

export function initTracingContext(where: string): void {
  const cls = ClsServiceManager.getClsService();
  cls.enter();
  const systemActor: Partial<IUser> = {
    id: uuid(),
    fullname: SYSTEM,
    username: SYSTEM,
  };
  const context: IContext = {
    requestId: cls.getId() ?? uuid(),
    actor: systemActor as IUser,
    event: where,
  };

  cls.set(CLS_REQ, { user: systemActor });
  cls.set(CONTEXT, context);
}

export function getDebugContext(context: IContext, methodName?: string): any {
  return {
    ...context,
    actor: { id: context?.actor?.id, username: context?.actor?.username },
    method: methodName,
  };
}
