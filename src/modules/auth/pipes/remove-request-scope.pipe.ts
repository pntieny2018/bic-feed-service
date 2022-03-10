import { REQUEST_CONTEXT } from '../interceptors';
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RemoveRequestScopePipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  transform(value: any): any {
    delete value[REQUEST_CONTEXT];
    return value;
  }
}
