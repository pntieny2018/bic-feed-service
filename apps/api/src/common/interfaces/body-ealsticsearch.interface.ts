type BoolAttr = {
  must?: any[];
  filter?: any[];
  should?: any[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  minimum_should_match?: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  must_not?: any[];
};
export type BodyES = {
  query: {
    bool: BoolAttr;
  };
};
