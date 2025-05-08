import { FurnitureItem } from './FurnitureItem'

export interface RoomDimensions {
  width: number
  length: number
  height: number
}

export interface RoomDesign {
  id: string
  name: string
  dimensions: RoomDimensions
  wallColor: string
  furniture: FurnitureItem[]
} 