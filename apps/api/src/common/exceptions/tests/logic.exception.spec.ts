import { LogicException } from '../logic.exception';

describe('LogicException', () => {
  it('should inherit from error', () => {
    const error = new LogicException('hello');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have id to equal 1', () => {
    const error = new LogicException('hello');

    expect(error.id).toEqual('hello');
  });
});
