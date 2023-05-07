export type NodePlateContent = {
  id?: string;
  type: string;
  text?: string;
  url?: string;
  children?: Partial<NodePlateContent>[];
};
