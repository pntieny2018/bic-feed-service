import { PipeTransform } from '@nestjs/common/interfaces/features/pipe-transform.interface';

export class PutMarkSeenPostDto implements PipeTransform {
  public transform(value: string): number[] {
    return value.split(',').map((e, index) => {
      const parseValue = parseInt(e);
      if (isNaN(parseValue)) {
        throw new Error(`Param ${e} at index ${index} is not valid.`);
      }
      return parseValue;
    });
  }
}
