import { COMPONENT_SCOPE, COMPONENT_TOKEN } from '@libs/common/constants';
import { Scope, Injectable } from '@nestjs/common';

export type RegisterOptions = { injectToken?: string | symbol; scope?: Scope };

const register = (opts?: RegisterOptions): ClassDecorator => {
  return function (target: object): void {
    if (opts?.scope) {
      Reflect.defineMetadata(COMPONENT_SCOPE, opts?.scope, target);
    }
    if (opts?.injectToken) {
      Reflect.defineMetadata(COMPONENT_TOKEN, opts.injectToken, target);
    }
  };
};

export const Component = (opts?: RegisterOptions): ClassDecorator => {
  if (!opts || !opts?.injectToken) {
    return Injectable({ scope: opts?.scope });
  }
  return register(opts);
};
