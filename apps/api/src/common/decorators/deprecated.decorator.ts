import { NotFoundException, SetMetadata } from '@nestjs/common';

export function Deprecated(message?: string): MethodDecorator {
  const defaultMessage = 'This API is deprecated and will be removed in future versions.';

  return (_, __, descriptor: PropertyDescriptor) => {
    const deprecationMessage = message || defaultMessage;

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      throw new NotFoundException(deprecationMessage);
    };

    SetMetadata('deprecated', deprecationMessage)(descriptor.value);
    return descriptor;
  };
}
