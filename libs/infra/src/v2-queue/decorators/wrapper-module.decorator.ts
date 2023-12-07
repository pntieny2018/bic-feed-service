import { COMPONENT_SCOPE, COMPONENT_TOKEN } from '@libs/common/constants';
import { applyDecorators, ClassProvider, Module, ModuleMetadata } from '@nestjs/common';

type ModuleProviders = ModuleMetadata['providers'];
type ModuleExports = ModuleMetadata['exports'];

const initProviders = (providers: ModuleProviders): ModuleProviders => {
  return providers.map((provider) => {
    const scope = Reflect.getMetadata(COMPONENT_SCOPE, provider);
    const componentToken = Reflect.getMetadata(COMPONENT_TOKEN, provider);
    if (componentToken) {
      return {
        scope: scope,
        useClass: provider,
        provide: componentToken,
      } as ClassProvider;
    }
    return provider;
  });
};

const initExports = (exports: ModuleExports): ModuleExports => {
  return exports.map((member) => {
    if (typeof member === 'string' || typeof member === 'symbol') {
      return member;
    }
    const componentToken = Reflect.getMetadata(COMPONENT_TOKEN, member);

    if (componentToken) {
      return componentToken;
    }
    return member;
  });
};

export const WrapperModule = (metadata: ModuleMetadata): ClassDecorator => {
  const { providers, exports } = metadata;
  if (providers && providers.length) {
    metadata.providers = initProviders(metadata.providers);
  }
  if (exports && exports.length) {
    metadata.exports = initExports(metadata.exports);
  }
  return applyDecorators(Module(metadata));
};
