export interface ICategoryValidator {
  checkValidCategories(categoryIds: string[], createdBy: string): Promise<void>;
}

export const CATEGORY_VALIDATOR_TOKEN = 'CATEGORY_VALIDATOR_TOKEN';
