import { ApiProperty } from '@nestjs/swagger';

export class ResponseMeta {
  @ApiProperty()
  public message: string;

  @ApiProperty({ required: false })
  public errors?: unknown;

  @ApiProperty({ required: false })
  public stack?: unknown;
}

export class ResponseDto<T> {
  @ApiProperty()
  public code: number;

  public data: T;

  @ApiProperty()
  public meta: ResponseMeta;

  public constructor(data: Partial<ResponseDto<T>>) {
    Object.assign(this, data);
  }
}
