export class GetPaginationDto<T> {
  public offset?: number;
  public limit?: number;
  public idLt?: number;
  public idGt?: number;

  public options: T;
}
