import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import snakecaseKeys from 'snakecase-keys';

@Injectable()
export class TransformRequestPipe implements PipeTransform {
  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (
      (metadata.type === 'body' || metadata.type === 'query') &&
      typeof value === 'object' &&
      value !== null
    ) {
      return snakecaseKeys(value);
    }
    return value;
  }
}