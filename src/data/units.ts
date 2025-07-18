import { UnitType, UnitData } from '../types/game'
import { Sword, Eye, Shield, Target, Crown, Zap, Ship, Mountain } from 'lucide-react'

export const unitData: Record<UnitType, UnitData & { name: string; description: string; color: string }> = {
  warrior: {
    health: 10,
    attack: 4,
    defense: 3,
    movement: 2,
    cost: 5,
    abilities: ['melee'],
    name: 'Warrior',
    description: 'Basic melee combat unit',
    color: 'bg-red-600'
  },
  scout: {
    health: 8,
    attack: 2,
    defense: 2,
    movement: 4,
    cost: 4,
    abilities: ['stealth', 'reconnaissance'],
    name: 'Scout',
    description: 'Fast reconnaissance unit',
    color: 'bg-green-600'
  },
  defender: {
    health: 15,
    attack: 3,
    defense: 5,
    movement: 1,
    cost: 6,
    abilities: ['fortify', 'shield_wall'],
    name: 'Defender',
    description: 'Heavy defensive unit',
    color: 'bg-blue-600'
  },
  archer: {
    health: 8,
    attack: 5,
    defense: 2,
    movement: 2,
    cost: 7,
    abilities: ['ranged', 'precision'],
    name: 'Archer',
    description: 'Ranged combat specialist',
    color: 'bg-purple-600'
  },
  knight: {
    health: 12,
    attack: 6,
    defense: 4,
    movement: 3,
    cost: 10,
    abilities: ['charge', 'mounted'],
    name: 'Knight',
    description: 'Elite mounted warrior',
    color: 'bg-yellow-600'
  },
  catapult: {
    health: 6,
    attack: 8,
    defense: 1,
    movement: 1,
    cost: 12,
    abilities: ['siege', 'area_damage'],
    name: 'Catapult',
    description: 'Siege warfare engine',
    color: 'bg-orange-600'
  },
  battleship: {
    health: 20,
    attack: 7,
    defense: 6,
    movement: 3,
    cost: 15,
    abilities: ['naval', 'bombardment'],
    name: 'Battleship',
    description: 'Naval combat vessel',
    color: 'bg-cyan-600'
  },
  giant: {
    health: 25,
    attack: 10,
    defense: 8,
    movement: 2,
    cost: 20,
    abilities: ['massive', 'intimidate'],
    name: 'Giant',
    description: 'Massive combat unit',
    color: 'bg-indigo-600'
  }
}

export const getUnitIcon = (unitType: UnitType) => {
  const iconMap = {
    warrior: Sword,
    scout: Eye,
    defender: Shield,
    archer: Target,
    knight: Crown,
    catapult: Zap,
    battleship: Ship,
    giant: Mountain
  }
  
  return iconMap[unitType] || Sword
}

export const getUnitColor = (unitType: UnitType) => {
  return unitData[unitType]?.color || 'bg-gray-600'
}