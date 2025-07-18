export type UnitType = 'warrior' | 'scout' | 'defender' | 'archer' | 'knight' | 'catapult' | 'battleship' | 'giant'

export type TileType = 'grass' | 'forest' | 'mountain' | 'water' | 'city'

export type Player = 'player' | 'enemy' | 'neutral'

export interface Unit {
  id: string
  type: UnitType
  owner: Player
  health: number
  maxHealth: number
  attack: number
  defense: number
  movement: number
  maxMovement: number
  hasActed: boolean
  hasMoved: boolean
  experience: number
  level: number
  abilities: string[]
}

export interface HexTile {
  id: string
  q: number
  r: number
  type: TileType
  owner: Player
  unit?: Unit
  resources: number
}

export interface GameState {
  currentTurn: Player
  turnNumber: number
  phase: 'move' | 'attack' | 'end'
  selectedTile: string | null
  selectedUnit: string | null
  validMoves: string[]
  validAttacks: string[]
  gameOver: boolean
  winner: Player | null
}

export interface Technology {
  id: string
  name: string
  description: string
  cost: number
  prerequisites: string[]
  unlocks: string[]
}

export interface UnitData {
  health: number
  attack: number
  defense: number
  movement: number
  cost: number
  abilities: string[]
}

export interface CombatResult {
  attackerDamage: number
  defenderDamage: number
  attackerSurvived: boolean
  defenderSurvived: boolean
}