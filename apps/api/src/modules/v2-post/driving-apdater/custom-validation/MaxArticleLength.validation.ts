import { StringHelper } from '@libs/common/helpers';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function MaxArticleLength(property: number, validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string): void {
    registerDecorator({
      name: 'MaxArticleLength',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const str = StringHelper.serializeEditorContentToText(value);
          console.log(str);
          console.log(str.length);
          return str.trim().length <= args.constraints[0];
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `Your content cannot exceed ${validationArguments.value} characters.`;
        },
      },
    });
  };
}
