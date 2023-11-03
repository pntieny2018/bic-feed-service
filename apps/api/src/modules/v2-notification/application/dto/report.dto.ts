export class ReportObjectDto {
  public targetId: string;
  public targetType: string;
  public details: Record<string, any>[];
  public status: string;
}
