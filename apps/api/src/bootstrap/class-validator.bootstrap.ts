import {
  DynamicModule,
  INestApplication,
  Logger,
  Type,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { ValidatorException } from '../common/exceptions';
import { StringHelper } from '../common/helpers';
import { TransformRequestPipe } from '@api/common/pipe/transform-request.pipe';

export type ConstraintItem = { title: string; message: string[] };

export class ClassValidatorBootstrap {
  /**
   * Initializers the ClassValidatorBootstrap.
   * Make class-validators can be injected as dependency module providers.
   * Use ValidationPipe as global pipes with custom errors response
   * @param app Reference instance of INestApplication.
   * @param module Class constructor of module or DynamicModule
   * @return void
   */
  public static init(app: INestApplication, module: Type | DynamicModule): void {
    useContainer(app.select(module), { fallbackOnErrors: true });
    Logger.debug('ClassValidatorProvider initialized', ClassValidatorBootstrap.name);
    app.useGlobalPipes(
      new TransformRequestPipe(),
      new ValidationPipe({
        transform: true,
        // whitelist: true,
        // forbidNonWhitelisted: true,
        // forbidUnknownValues: true,
        exceptionFactory: exceptionFactory,
      })
    );
  }
}

function exceptionFactory(errors: ValidationError[]): void {
  const flattenErrors = [];
  errors.forEach((e) => {
    flattenErrors.push(...mapChildrenToValidationErrors(e));
  });
  throw new ValidatorException(
    buildErrors(flattenErrors.filter((f) => Object.keys(f.constraints).length))
  );
}

function buildErrors(errors: ValidationError[]): ConstraintItem[] {
  const properties = errors.map((e) => e.property);
  // make the error message group by property
  const constraints: ConstraintItem[] = [];

  properties.forEach((p, index) => {
    const item: ConstraintItem = {
      message: Object.values(errors[index].constraints).map((ct) => {
        let msg = StringHelper.camelToSnakeCase(ct, ['UUID', 'uuid']);
        if (msg[0] === '_') {
          msg = msg.slice(1);
        }
        return msg;
      }),
      title: p,
    };
    constraints.push(item);
  });
  return constraints;
}

function mapChildrenToValidationErrors(
  error: ValidationError,
  parentPath?: string
): ValidationError[] {
  if (!(error.children && error.children.length)) {
    return [error];
  }
  const validationErrors = [];

  parentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

  for (const item of error.children) {
    if (item.children && item.children.length) {
      validationErrors.push(...mapChildrenToValidationErrors(item, parentPath));
    }
    validationErrors.push(prependConstraintsWithParentProp(parentPath, item));
  }
  return validationErrors;
}

function prependConstraintsWithParentProp(
  parentPath: string,
  error: ValidationError
): ValidationError {
  const constraints = {};
  for (const key in error.constraints) {
    error['property'] = `${parentPath}.${error['property']}`;
    constraints[key] = `${error.constraints[key]}`;
  }
  return {
    ...error,
    constraints,
  };
}
