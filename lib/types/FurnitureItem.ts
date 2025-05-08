import { Vector3 } from 'three'

export interface FurnitureItem {
  id: string
  modelPath: string
  position: Vector3
  rotation: Vector3
  scale: Vector3
  color: string
} 