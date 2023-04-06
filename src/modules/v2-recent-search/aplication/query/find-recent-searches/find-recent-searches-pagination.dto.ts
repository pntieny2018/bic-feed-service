export class FindRecentSearchesPaginationDto {
  public readonly rows: {
    id: string;
    createdBy: string;
    updatedBy: string;
    target: string;
    keyword: string;
    totalSearched: number;
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  public readonly total: number;
}
