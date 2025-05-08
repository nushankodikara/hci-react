import { RoomDesign, RoomDimensions } from '../types/RoomDesign'
import { Vector3 } from 'three'

export class RoomDesignValidator {
  static validateDimensions(dimensions: RoomDimensions): void {
    if (dimensions.width <= 0 || dimensions.length <= 0 || dimensions.height <= 0) {
      throw new Error('Room dimensions must be positive numbers')
    }
  }

  static validateFurniturePosition(position: Vector3, roomDimensions: RoomDimensions): void {
    if (
      position.x < 0 ||
      position.x > roomDimensions.width ||
      position.z < 0 ||
      position.z > roomDimensions.length ||
      position.y < 0 ||
      position.y > roomDimensions.height
    ) {
      throw new Error('Furniture position must be within room bounds')
    }
  }
} 