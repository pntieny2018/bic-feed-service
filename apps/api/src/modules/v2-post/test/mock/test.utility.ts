import { DeepMocked } from '@golevelup/ts-jest';
import { Mocked } from 'jest-mock';

export type MockClass<T> =
  | ({
      [key in keyof T]: jest.Mock<any, any>;
    } & DeepMocked<T>)
  | Mocked<T>;
