import { HexTile, Unit, Player, CombatResult } from '../types/game'

// Calculate distance between two hex tiles
export const hexDistance = (q1: number, r1: number, q2: number, r2: number): number => {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2
}

// Get neighboring hex coordinates
export const getNeighbors = (q: number, r: number): Array<{q: number, r: number}> => {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 }
  ]
}

// Get valid moves for a unit
export const getValidMoves = (unit: Unit, currentTile: HexTile, allTiles: HexTile[]): string[] => {
  if (unit.hasMoved || unit.hasActed) return []
  
  const validMoves: string[] = []
  const visited = new Set<string>()
  const queue = [{ q: currentTile.q, r: currentTile.r, distance: 0 }]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    const key = `${current.q},${current.r}`
    
    if (visited.has(key) || current.distance >= unit.movement) continue
    visited.add(key)
    
    const neighbors = getNeighbors(current.q, current.r)
    
    for (const neighbor of neighbors) {
      const neighborTile = allTiles.find(t => t.q === neighbor.q && t.r === neighbor.r)
      if (!neighborTile) continue
      
      // Can't move to tiles with units or impassable terrain
      if (neighborTile.unit || neighborTile.type === 'water' || neighborTile.type === 'mountain') continue
      
      const neighborKey = `${neighbor.q},${neighbor.r}`
      if (!visited.has(neighborKey) && current.distance + 1 <= unit.movement) {
        validMoves.push(neighborTile.id)
        queue.push({ q: neighbor.q, r: neighbor.r, distance: current.distance + 1 })
      }
    }
  }
  
  return validMoves.filter(id => id !== currentTile.id)
}

// Get valid attack targets for a unit
export const getValidAttacks = (unit: Unit, currentTile: HexTile, allTiles: HexTile[]): string[] => {
  if (unit.hasActed) return []
  
  const validAttacks: string[] = []
  const attackRange = unit.abilities.includes('ranged') ? 2 : 1
  
  for (const tile of allTiles) {
    if (!tile.unit || tile.unit.owner === unit.owner) continue
    
    const distance = hexDistance(currentTile.q, currentTile.r, tile.q, tile.r)
    if (distance <= attackRange) {
      validAttacks.push(tile.id)
    }
  }
  
  return validAttacks
}

// Move a unit from one tile to another
export const moveUnit = (tiles: HexTile[], fromTileId: string, toTileId: string): HexTile[] => {
  const fromTile = tiles.find(t => t.id === fromTileId)
  const toTile = tiles.find(t => t.id === toTileId)
  
  if (!fromTile || !toTile || !fromTile.unit) return tiles
  
  return tiles.map(tile => {
    if (tile.id === fromTileId) {
      return { ...tile, unit: undefined }
    }
    if (tile.id === toTileId) {
      return { 
        ...tile, 
        unit: { ...fromTile.unit!, hasMoved: true },
        owner: fromTile.unit!.owner
      }
    }
    return tile
  })
}

// Calculate combat result
export const calculateCombat = (attacker: Unit, defender: Unit): CombatResult => {
  // Base damage calculation with some randomness
  const attackerRoll = Math.random() * 0.4 + 0.8 // 0.8 to 1.2 multiplier
  const defenderRoll = Math.random() * 0.4 + 0.8
  
  const attackerDamage = Math.max(1, Math.floor(attacker.attack * attackerRoll - defender.defense * 0.5))
  const defenderDamage = Math.max(1, Math.floor(defender.attack * defenderRoll - attacker.defense * 0.5))
  
  return {
    attackerDamage,
    defenderDamage,
    attackerSurvived: attacker.health > defenderDamage,
    defenderSurvived: defender.health > attackerDamage
  }
}

// Attack a unit
export const attackUnit = (tiles: HexTile[], attackerTileId: string, defenderTileId: string): { tiles: HexTile[], combatResult: CombatResult | null } => {
  const attackerTile = tiles.find(t => t.id === attackerTileId)
  const defenderTile = tiles.find(t => t.id === defenderTileId)
  
  if (!attackerTile?.unit || !defenderTile?.unit) {
    return { tiles, combatResult: null }
  }
  
  const combatResult = calculateCombat(attackerTile.unit, defenderTile.unit)
  
  return {
    tiles: tiles.map(tile => {
      if (tile.id === attackerTileId) {
        const newHealth = Math.max(0, tile.unit!.health - combatResult.defenderDamage)
        return {
          ...tile,
          unit: newHealth > 0 ? { ...tile.unit!, health: newHealth, hasActed: true } : undefined
        }
      }
      if (tile.id === defenderTileId) {
        const newHealth = Math.max(0, tile.unit!.health - combatResult.attackerDamage)
        return {
          ...tile,
          unit: newHealth > 0 ? { ...tile.unit!, health: newHealth } : undefined,
          owner: newHealth <= 0 ? attackerTile.unit!.owner : tile.owner
        }
      }
      return tile
    }),
    combatResult
  }
}

// Simple AI move logic
export const makeAIMove = (tiles: HexTile[], aiPlayer: Player): HexTile[] => {
  let newTiles = [...tiles]
  
  // Find all AI units that can act
  const aiUnits = newTiles.filter(tile => 
    tile.unit && 
    tile.unit.owner === aiPlayer && 
    (!tile.unit.hasActed || !tile.unit.hasMoved)
  )
  
  for (const unitTile of aiUnits) {
    if (!unitTile.unit) continue
    
    // Try to attack first
    const validAttacks = getValidAttacks(unitTile.unit, unitTile, newTiles)
    if (validAttacks.length > 0 && !unitTile.unit.hasActed) {
      // Attack the first available target
      const targetTileId = validAttacks[0]
      const result = attackUnit(newTiles, unitTile.id, targetTileId)
      newTiles = result.tiles
      continue
    }
    
    // Try to move towards enemy units
    const validMoves = getValidMoves(unitTile.unit, unitTile, newTiles)
    if (validMoves.length > 0 && !unitTile.unit.hasMoved) {
      // Find closest enemy unit
      const enemyUnits = newTiles.filter(tile => 
        tile.unit && tile.unit.owner !== aiPlayer
      )
      
      if (enemyUnits.length > 0) {
        let bestMove = validMoves[0]
        let bestDistance = Infinity
        
        for (const moveId of validMoves) {
          const moveTile = newTiles.find(t => t.id === moveId)!
          
          for (const enemyTile of enemyUnits) {
            const distance = hexDistance(moveTile.q, moveTile.r, enemyTile.q, enemyTile.r)
            if (distance < bestDistance) {
              bestDistance = distance
              bestMove = moveId
            }
          }
        }
        
        newTiles = moveUnit(newTiles, unitTile.id, bestMove)
      }
    }
  }
  
  return newTiles
}

// Reset unit actions for a new turn
export const resetUnitActions = (tiles: HexTile[], player: Player): HexTile[] => {
  return tiles.map(tile => {
    if (tile.unit && tile.unit.owner === player) {
      return {
        ...tile,
        unit: {
          ...tile.unit,
          hasActed: false,
          hasMoved: false,
          movement: tile.unit.maxMovement
        }
      }
    }
    return tile
  })
}

// Check victory conditions
export const checkVictoryConditions = (tiles: HexTile[]): Player | null => {
  const playerUnits = tiles.filter(tile => tile.unit?.owner === 'player').length
  const enemyUnits = tiles.filter(tile => tile.unit?.owner === 'enemy').length
  
  // Only check for elimination if the game has progressed (turn > 1)
  if (playerUnits === 0) return 'enemy'
  if (enemyUnits === 0) return 'player'
  
  // Check territory control (75% of non-neutral tiles) - only after turn 5
  const controlledTiles = tiles.filter(tile => tile.owner !== 'neutral')
  const playerTiles = tiles.filter(tile => tile.owner === 'player').length
  const enemyTiles = tiles.filter(tile => tile.owner === 'enemy').length
  
  if (controlledTiles.length > 10) { // Only check territory control when there are enough controlled tiles
    const totalTiles = tiles.length
    const playerControl = playerTiles / totalTiles
    const enemyControl = enemyTiles / totalTiles
    
    if (playerControl >= 0.6) return 'player'
    if (enemyControl >= 0.6) return 'enemy'
  }
  
  return null
}