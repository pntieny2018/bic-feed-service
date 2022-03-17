import { ClassType } from '../types';
import { ResponseDto, ResponseMeta } from '../dto';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { applyDecorators, HttpStatus, Type } from '@nestjs/common';

// function ResponseDtoMixinClass<T extends ClassType>(resourceCls: T): ClassType {
//   class ResponseDto {
//     @ApiProperty({
//       default: HttpStatus.OK,
//     })
//     public code: number;
//
//     @ApiProperty({
//       type: resourceCls,
//       description: resourceCls.name,
//     })
//     public data: T;
//
//     @ApiProperty({
//       required: false,
//     })
//     public meta?: ResponseMeta;
//   }
//
//   return ResponseDto;
// }

export function GenericApiOkResponse<TModel extends Type>(
  model: TModel,
  description?: string
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
      description: description ?? 'OK',
    })
  );
}
