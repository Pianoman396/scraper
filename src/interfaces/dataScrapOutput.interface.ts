export interface dataScrapOutput {
  _result: OutputData
}

export type OutputData = {
  _website: [string],
  _link: [string],
  _statusCode: number,
}