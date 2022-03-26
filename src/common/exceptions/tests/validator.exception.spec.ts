import { ValidatorException } from '../validator.exception';

describe('ValidatorException', () => {
  it('should return a response as a string when input is a string', () => {
    const message = 'My error message';
    expect(new ValidatorException(message).getResponse()).toEqual('My error message');
  });

  it('should return a response as an object when input is an object', () => {
    const message = {
      message: 'My error message',
      reason: 'this can be a human readable reason',
      anything: 'else',
    };
    expect(new ValidatorException(message).getResponse()).toEqual(message);
  });

  it('should inherit from error', () => {
    const error = new ValidatorException('');
    expect(error).toBeInstanceOf(Error);
  });
});
