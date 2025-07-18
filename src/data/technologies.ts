import { Technology } from '../types/game'

export const technologies: Technology[] = [
  {
    id: 'archery',
    name: 'Archery',
    description: 'Unlocks Archer units with ranged attacks',
    cost: 8,
    prerequisites: [],
    unlocks: ['archer']
  },
  {
    id: 'riding',
    name: 'Riding',
    description: 'Unlocks Knight units with mounted combat',
    cost: 12,
    prerequisites: [],
    unlocks: ['knight']
  },
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Unlocks Catapult units for siege warfare',
    cost: 15,
    prerequisites: ['archery'],
    unlocks: ['catapult']
  },
  {
    id: 'sailing',
    name: 'Sailing',
    description: 'Unlocks Battleship units for naval combat',
    cost: 18,
    prerequisites: [],
    unlocks: ['battleship']
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Unlocks Giant units with massive power',
    cost: 25,
    prerequisites: ['engineering'],
    unlocks: ['giant']
  },
  {
    id: 'tactics',
    name: 'Tactics',
    description: 'Improves all unit combat effectiveness',
    cost: 10,
    prerequisites: [],
    unlocks: ['combat_bonus']
  },
  {
    id: 'mining',
    name: 'Mining',
    description: 'Increases resource generation from mountains',
    cost: 6,
    prerequisites: [],
    unlocks: ['resource_bonus']
  },
  {
    id: 'forestry',
    name: 'Forestry',
    description: 'Allows movement through forests without penalty',
    cost: 5,
    prerequisites: [],
    unlocks: ['forest_movement']
  }
]