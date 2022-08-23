type BoolAttr = {
  must: any[];
  filter: any[];
  should: any[];
};
export type BodyES = {
  query: {
    bool: BoolAttr;
  };
};
