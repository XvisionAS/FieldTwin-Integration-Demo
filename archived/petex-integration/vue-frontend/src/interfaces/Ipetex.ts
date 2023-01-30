interface IpetexWellObject {
  ObjectInstanceId: number,
  ObjectInstanceName: string,
}
interface IpetexValue {
  datasetId: number,
  ObjectTypePropertyID: number,
  ObjectTypePropertyName: string,
  dataSourceName: string,
  CurrentValue: string | number,
  AliasText: string,
  isString: boolean
}

interface IpetexDataPoint {
  DataSetId: number,
  TimeOfSample: string,
  NumericValue: number,
  StringValue: string,
}
interface IdataPointTimeValue {
  time: Date,
  value: number
}
interface  IhashPetexWellObject {
  [key: string]: IpetexWellObject
}
export {
  IpetexValue,
  IpetexDataPoint,
  IpetexWellObject,
  IhashPetexWellObject,
  IdataPointTimeValue
}
