import { StringHelper } from '@libs/common/helpers';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function MaxMarkdownLength(property: number, validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string): void {
    registerDecorator({
      name: 'MaxMarkdownLength',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const str = StringHelper.removeMarkdownCharacter(value);
          return str.trim().length <= args.constraints[0];
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `Your content cannot exceed ${validationArguments.value} characters.`;
        },
      },
    });
  };
}
