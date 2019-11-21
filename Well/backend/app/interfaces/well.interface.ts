interface Point {
  x: number,
  y: number,
  z: number
}
interface Well {
  subProject: string,
  name: string,
  path: Point[],
  radius: number,
  radiusViewDependant: boolean
  x: number,
  y: number,
  visible: boolean,
  color: string,
  labelVisible: boolean,
  labelOffsetX: number,
  labelOffsetY: number,
  labelRotation: number,
  fromWaterLevel: boolean
}

export {
  Point,
  Well
}
