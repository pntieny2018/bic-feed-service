import { ClassConstructor } from '../helpers';
import { applyDecorators } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

export const On = (cls: ClassConstructor<any>): MethodDecorator => {
  if (!cls['event']) {
    throw new RuntimeException(`Can't find event register from ${cls.name}`);
  }
  return applyDecorators(OnEvent(cls['event']));
};
