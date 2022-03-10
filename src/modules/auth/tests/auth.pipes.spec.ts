import { RemoveRequestScopePipe } from '../pipes';
import { REQUEST_CONTEXT } from '../interceptors';

const removeRequestScopePipe = new RemoveRequestScopePipe();

describe('AuthPipes', () => {
  describe('removeRequestScopePipe - tests', () => {
    describe('undefined REQUEST_CONTEXT', () => {
      const val = {
        fieldA: null,
        fieldB: null,
      };
      it('resp[REQUEST_CONTEXT] should be undefined && resp is equal to val', () => {
        const resp = removeRequestScopePipe.transform(val);
        expect(resp[REQUEST_CONTEXT]).toBeUndefined();
        expect(resp).toEqual(val);
      });
    });

    describe('REQUEST_CONTEXT is null', () => {
      const val = {
        fieldA: null,
        fieldB: null,
        [REQUEST_CONTEXT]: null,
      };
      it('resp[REQUEST_CONTEXT] should be undefined && another fields still exists on resp', () => {
        const resp = removeRequestScopePipe.transform(val);
        expect(resp[REQUEST_CONTEXT]).toBeUndefined();
        expect(resp).toEqual({ fieldA: null, fieldB: null });
      });
    });

    describe('REQUEST_CONTEXT is object', () => {
      const val = {
        fieldA: null,
        fieldB: null,
        [REQUEST_CONTEXT]: {},
      };
      it('resp[REQUEST_CONTEXT] should be undefined && another fields still exists on resp', () => {
        const resp = removeRequestScopePipe.transform(val);
        expect(resp[REQUEST_CONTEXT]).toBeUndefined();
        expect(resp).toEqual({ fieldA: null, fieldB: null });
      });
    });
  });
});
