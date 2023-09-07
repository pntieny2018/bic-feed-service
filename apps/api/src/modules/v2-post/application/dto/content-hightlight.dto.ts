export class ContentHighlightDto {
  public highlight?: string;
  public titleHighlight?: string;
  public summaryHighlight?: string;

  public constructor(data?: Partial<ContentHighlightDto>) {
    Object.assign(this, data);
  }
}
