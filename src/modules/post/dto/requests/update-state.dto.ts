export enum StateVerb {
  archive = 'ARCHIVE',
  restore = 'RESTORE',
}

export class UpdateStateDto {
  public data: UpdateStateDtoData;
}

class UpdateStateDtoData {
  public object: { groups: { id: string }[] };
  public verb: StateVerb;
  public target: string;
}
