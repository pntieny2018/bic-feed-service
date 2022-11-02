type BoolAttr = {
  must: any[];
  filter: any[];
  should: any[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  minimum_should_match: number;
};
export type BodyES = {
  query: {
    bool: BoolAttr;
  };
};
