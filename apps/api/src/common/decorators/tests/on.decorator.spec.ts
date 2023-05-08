import { On } from '../on.decorator';
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception';

describe('OnDecorator', function () {
  it('should throw exception if class not register event', () => {
    const classMock = () => {
      return class ClassMock {
        // class missing static property `event`
        public data: Record<string, string>;
      };
    };

    try {
      On(classMock());
    } catch (e) {
      expect(e).toBeInstanceOf(RuntimeException);
      expect((e as RuntimeException).message).toEqual(
        `Can't find event register from ${classMock().name}`
      );
    }
  });

  it('registered event', () => {
    const classMock = () => {
      return class ClassMock {
        public static event = 'event.name';
        public data: Record<string, string>;
      };
    };
    let ex;
    try {
      On(classMock());
    } catch (e) {
      ex = e;
    }

    expect(ex).toBeUndefined();
  });
});
