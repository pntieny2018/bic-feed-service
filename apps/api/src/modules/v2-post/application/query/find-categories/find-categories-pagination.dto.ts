export class FindCategoriesPaginationDto {
  public readonly rows: {
    id: string;
    parentId: string;
    active: boolean;
    name: string;
    level: number;
    slug: string;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }[];
  public readonly total: number;
  public constructor(data: Partial<FindCategoriesPaginationDto>) {
    Object.assign(this, data);
  }
}
