export type FindOneCategoryOptions = {
  where: {
    id?: string;
    ids?: string[];
    createdBy?: string;
    shouldDisjunctionLevel?: boolean;
  };
};

export interface ICategoryRepository {
  count(whereOptions: FindOneCategoryOptions): Promise<number>;
}

export const CATEGORY_REPOSITORY_TOKEN = 'CATEGORY_REPOSITORY_TOKEN';
