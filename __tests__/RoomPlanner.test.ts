import { describe, it, expect, beforeEach } from 'vitest'
import { RoomDesign } from '../lib/types/RoomDesign'
import { FurnitureItem } from '../lib/types/FurnitureItem'
import { Vector3 } from 'three'
import { RoomDesignValidator } from '../lib/validators/RoomDesignValidator'

// Mock room design data
const mockRoomDesign: RoomDesign = {
  id: '1',
  name: 'Test Room',
  dimensions: { width: 500, length: 400, height: 300 },
  wallColor: '#FFFFFF',
  furniture: []
}

// Mock furniture item
const mockFurniture: FurnitureItem = {
  id: '1',
  modelPath: '/models/chair.glb',
  position: new Vector3(0, 0, 0),
  rotation: new Vector3(0, 0, 0),
  scale: new Vector3(1, 1, 1),
  color: '#000000'
}

describe('Room Planner Tests', () => {
  let roomDesign: RoomDesign

  beforeEach(() => {
    roomDesign = { ...mockRoomDesign, furniture: [] }
  })

  it('should create a new room design with valid dimensions', () => {
    expect(roomDesign.dimensions.width).toBe(500)
    expect(roomDesign.dimensions.length).toBe(400)
    expect(roomDesign.dimensions.height).toBe(300)
  })

  it('should add furniture to room design', () => {
    roomDesign.furniture.push(mockFurniture)
    expect(roomDesign.furniture.length).toBe(1)
    expect(roomDesign.furniture[0].id).toBe('1')
  })

  it('should update furniture position', () => {
    roomDesign.furniture.push(mockFurniture)
    const newPosition = new Vector3(100, 0, 100)
    roomDesign.furniture[0].position = newPosition
    expect(roomDesign.furniture[0].position).toEqual(newPosition)
  })

  it('should update furniture rotation', () => {
    roomDesign.furniture.push(mockFurniture)
    const newRotation = new Vector3(0, Math.PI / 2, 0)
    roomDesign.furniture[0].rotation = newRotation
    expect(roomDesign.furniture[0].rotation).toEqual(newRotation)
  })

  it('should update furniture scale', () => {
    roomDesign.furniture.push(mockFurniture)
    const newScale = new Vector3(2, 2, 2)
    roomDesign.furniture[0].scale = newScale
    expect(roomDesign.furniture[0].scale).toEqual(newScale)
  })

  it('should update wall color', () => {
    const newColor = '#FF0000'
    roomDesign.wallColor = newColor
    expect(roomDesign.wallColor).toBe(newColor)
  })

  it('should update furniture color', () => {
    roomDesign.furniture.push(mockFurniture)
    const newColor = '#FF0000'
    roomDesign.furniture[0].color = newColor
    expect(roomDesign.furniture[0].color).toBe(newColor)
  })

  it('should remove furniture from room', () => {
    roomDesign.furniture.push({ ...mockFurniture })
    const initialLength = roomDesign.furniture.length
    roomDesign.furniture = roomDesign.furniture.filter(item => item.id !== '1')
    expect(roomDesign.furniture.length).toBe(initialLength - 1)
  })

  it('should validate room dimensions', () => {
    expect(() => {
      RoomDesignValidator.validateDimensions({ width: -1, length: 400, height: 300 })
    }).toThrow('Room dimensions must be positive numbers')
  })

  it('should maintain furniture position within room bounds', () => {
    roomDesign.furniture.push({ ...mockFurniture })
    const outOfBoundsPosition = new Vector3(1000, 0, 1000)
    expect(() => {
      RoomDesignValidator.validateFurniturePosition(outOfBoundsPosition, roomDesign.dimensions)
    }).toThrow('Furniture position must be within room bounds')
  })
}) 