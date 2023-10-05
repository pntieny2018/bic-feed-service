export enum VerbActivity {
  APPROVE_REPORT_CONTENT = 'APPROVE_REPORT_CONTENT',
  POST = 'POST',
  ADD = 'ADD',
  COMMENT = 'COMMENT',
  REACT = 'REACT',
  REPORT = 'REPORT',
  DELETE = 'DELETE', //delete series
  REMOVE = 'REMOVE', //remove item of series
  CHANGE = 'CHANGE', //remove item of series
}

export enum TargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  ARTICLE = 'ARTICLE',
  SERIES = 'SERIES',
  CHILD_COMMENT = 'CHILD_COMMENT',
  REPORT_CONTENT = 'REPORT_CONTENT',
}
