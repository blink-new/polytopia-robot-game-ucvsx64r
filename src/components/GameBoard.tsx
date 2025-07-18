import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import TechnologyTree from './TechnologyTree'
import UnitProduction from './UnitProduction'
import { HexTile, Unit, GameState, UnitType } from '../types/game'
import { unitData, getUnitIcon } from '../data/units'
import { technologies } from '../data/technologies'
import { 
  getValidMoves, 
  getValidAttacks, 
  moveUnit, 
  attackUnit, 
  makeAIMove, 
  resetUnitActions,
  checkVictoryConditions 
} from '../utils/gameLogic'
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Target, 
  Sword, 
  Shield, 
  Crown,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react'

interface GameBoardProps {
  robotSkin: string
  onBackToMenu: () => void
}

const GameBoard: React.FC<GameBoardProps> = ({ robotSkin, onBackToMenu }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentTurn: 'player',
    turnNumber: 1,
    phase: 'move',
    selectedTile: null,
    selectedUnit: null,
    validMoves: [],
    validAttacks: [],
    gameOver: false,
    winner: null
  })

  const [resources, setResources] = useState({ 
    stars: 15, 
    population: 3, 
    science: 5 
  })
  
  const [researchedTechs, setResearchedTechs] = useState<string[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [isAIThinking, setIsAIThinking] = useState(false)

  // Generate hexagonal grid with more variety
  const generateHexGrid = useCallback((): HexTile[] => {
    const tiles: HexTile[] = []
    const radius = 5
    
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius)
      const r2 = Math.min(radius, -q + radius)
      for (let r = r1; r <= r2; r++) {
        const rand = Math.random()
        let tileType: HexTile['type'] = 'grass'
        
        if (rand < 0.15) tileType = 'mountain'
        else if (rand < 0.25) tileType = 'water'
        else if (rand < 0.35) tileType = 'forest'
        else tileType = 'grass'
        
        tiles.push({
          id: `${q},${r}`,
          q,
          r,
          type: tileType,
          owner: 'neutral',
          unit: undefined,
          resources: Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
        })
      }
    }
    
    // Add starting positions with cities - ensure they exist
    let playerStartTile = tiles.find(t => t.q === -3 && t.r === 2)
    let enemyStartTile = tiles.find(t => t.q === 3 && t.r === -2)
    
    // If preferred positions don't exist, find alternatives
    if (!playerStartTile) {
      playerStartTile = tiles.find(t => t.q <= -2 && t.r >= 1 && t.type !== 'water' && t.type !== 'mountain')
    }
    if (!enemyStartTile) {
      enemyStartTile = tiles.find(t => t.q >= 2 && t.r <= -1 && t.type !== 'water' && t.type !== 'mountain')
    }
    
    if (playerStartTile) {
      playerStartTile.type = 'city'
      playerStartTile.owner = 'player'
      const unitType = robotSkin as UnitType
      const unitStats = unitData[unitType] || unitData['warrior']
      playerStartTile.unit = {
        id: 'player-1',
        type: unitType,
        owner: 'player',
        health: unitStats.health,
        maxHealth: unitStats.health,
        attack: unitStats.attack,
        defense: unitStats.defense,
        movement: unitStats.movement,
        maxMovement: unitStats.movement,
        hasActed: false,
        hasMoved: false,
        experience: 0,
        level: 1,
        abilities: unitStats.abilities
      }
    }
    
    if (enemyStartTile) {
      enemyStartTile.type = 'city'
      enemyStartTile.owner = 'enemy'
      const unitStats = unitData['warrior']
      enemyStartTile.unit = {
        id: 'enemy-1',
        type: 'warrior',
        owner: 'enemy',
        health: unitStats.health,
        maxHealth: unitStats.health,
        attack: unitStats.attack,
        defense: unitStats.defense,
        movement: unitStats.movement,
        maxMovement: unitStats.movement,
        hasActed: false,
        hasMoved: false,
        experience: 0,
        level: 1,
        abilities: unitStats.abilities
      }
    }
    
    // Add some additional enemy units
    const enemyPositions = [
      { q: 2, r: -1 },
      { q: 1, r: 0 },
      { q: 4, r: -3 }
    ]
    
    enemyPositions.forEach((pos, index) => {
      const tile = tiles.find(t => t.q === pos.q && t.r === pos.r)
      if (tile && !tile.unit && tile.type !== 'water') {
        tile.unit = {
          id: `enemy-${index + 2}`,
          type: index === 0 ? 'scout' : 'warrior',
          owner: 'enemy',
          health: index === 0 ? 8 : 10,
          maxHealth: index === 0 ? 8 : 10,
          attack: index === 0 ? 2 : 4,
          defense: index === 0 ? 2 : 3,
          movement: index === 0 ? 4 : 2,
          maxMovement: index === 0 ? 4 : 2,
          hasActed: false,
          hasMoved: false,
          experience: 0,
          level: 1,
          abilities: index === 0 ? ['stealth', 'reconnaissance'] : ['melee']
        }
        tile.owner = 'enemy'
      }
    })
    
    return tiles
  }, [robotSkin])

  const [hexTiles, setHexTiles] = useState<HexTile[]>(generateHexGrid())

  // Convert hex coordinates to pixel coordinates
  const hexToPixel = (q: number, r: number) => {
    const size = 28
    const x = size * (3/2 * q)
    const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
    return { x, y }
  }

  // Handle tile selection and unit actions
  const handleTileClick = (tileId: string) => {
    const tile = hexTiles.find(t => t.id === tileId)
    if (!tile || gameState.currentTurn !== 'player' || gameState.gameOver) return

    // If clicking on a valid move destination
    if (gameState.validMoves.includes(tileId) && gameState.selectedTile) {
      const newTiles = moveUnit(hexTiles, gameState.selectedTile, tileId)
      setHexTiles(newTiles)
      playSound('move')
      
      setGameState(prev => ({
        ...prev,
        selectedTile: null,
        validMoves: [],
        validAttacks: []
      }))
      return
    }

    // If clicking on a valid attack target
    if (gameState.validAttacks.includes(tileId) && gameState.selectedTile) {
      const result = attackUnit(hexTiles, gameState.selectedTile, tileId)
      setHexTiles(result.tiles)
      
      if (result.combatResult) {
        const attacker = hexTiles.find(t => t.id === gameState.selectedTile)?.unit
        const defender = tile.unit
        const logEntry = `${attacker?.type} attacks ${defender?.type}! Damage: ${result.combatResult.attackerDamage} vs ${result.combatResult.defenderDamage}`
        setCombatLog(prev => [logEntry, ...prev.slice(0, 4)])
        playSound('attack')
      }
      
      setGameState(prev => ({
        ...prev,
        selectedTile: null,
        validMoves: [],
        validAttacks: []
      }))
      return
    }

    // Select new tile/unit
    if (tile.unit?.owner === 'player' && !tile.unit.hasActed) {
      const validMoves = getValidMoves(tile.unit, tile, hexTiles)
      const validAttacks = getValidAttacks(tile.unit, tile, hexTiles)
      
      setGameState(prev => ({
        ...prev,
        selectedTile: tileId,
        selectedUnit: tile.unit?.id || null,
        validMoves,
        validAttacks
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        selectedTile: tileId,
        selectedUnit: null,
        validMoves: [],
        validAttacks: []
      }))
    }
  }

  // End turn and trigger AI
  const handleEndTurn = async () => {
    if (gameState.currentTurn === 'player') {
      // Reset player units and switch to enemy
      const resetTiles = resetUnitActions(hexTiles, 'player')
      setHexTiles(resetTiles)
      
      setGameState(prev => ({
        ...prev,
        currentTurn: 'enemy',
        selectedTile: null,
        validMoves: [],
        validAttacks: []
      }))
      
      // AI turn
      setIsAIThinking(true)
      setTimeout(() => {
        const aiTiles = makeAIMove(resetTiles, 'enemy')
        const finalTiles = resetUnitActions(aiTiles, 'enemy')
        setHexTiles(finalTiles)
        
        setGameState(prev => ({
          ...prev,
          currentTurn: 'player',
          turnNumber: prev.turnNumber + 1
        }))
        
        // Add resources each turn
        setResources(prev => ({
          stars: prev.stars + 3,
          population: prev.population + 1,
          science: prev.science + 2
        }))
        
        setIsAIThinking(false)
        playSound('turn')
      }, 1500)
    }
  }

  // Research technology
  const handleResearchTechnology = (techId: string) => {
    const tech = technologies.find(t => t.id === techId)
    if (!tech || resources.science < tech.cost) return
    
    setResearchedTechs(prev => [...prev, techId])
    setResources(prev => ({ ...prev, science: prev.science - tech.cost }))
    playSound('research')
  }

  // Produce unit
  const handleProduceUnit = (unitType: UnitType) => {
    const unitStats = unitData[unitType]
    if (!unitStats || resources.stars < unitStats.cost || !gameState.selectedTile) return
    
    const selectedTile = hexTiles.find(t => t.id === gameState.selectedTile)
    if (!selectedTile || selectedTile.type !== 'city' || selectedTile.unit) return
    
    const newUnit: Unit = {
      id: `player-${Date.now()}`,
      type: unitType,
      owner: 'player',
      health: unitStats.health,
      maxHealth: unitStats.health,
      attack: unitStats.attack,
      defense: unitStats.defense,
      movement: unitStats.movement,
      maxMovement: unitStats.movement,
      hasActed: true, // Can't act on the turn they're produced
      hasMoved: true,
      experience: 0,
      level: 1,
      abilities: unitStats.abilities
    }
    
    const newTiles = hexTiles.map(tile => 
      tile.id === gameState.selectedTile 
        ? { ...tile, unit: newUnit }
        : tile
    )
    
    setHexTiles(newTiles)
    setResources(prev => ({ ...prev, stars: prev.stars - unitStats.cost }))
    playSound('produce')
  }

  // Get available units based on research
  const getAvailableUnits = (): UnitType[] => {
    const baseUnits: UnitType[] = ['warrior', 'scout', 'defender']
    const unlockedUnits: UnitType[] = []
    
    if (researchedTechs.includes('archery')) unlockedUnits.push('archer')
    if (researchedTechs.includes('riding')) unlockedUnits.push('knight')
    if (researchedTechs.includes('engineering')) unlockedUnits.push('catapult')
    if (researchedTechs.includes('sailing')) unlockedUnits.push('battleship')
    if (researchedTechs.includes('mathematics')) unlockedUnits.push('giant')
    
    return [...baseUnits, ...unlockedUnits]
  }

  // Sound effects
  const playSound = useCallback((type: 'move' | 'attack' | 'turn' | 'research' | 'produce') => {
    if (!soundEnabled) return
    
    // Create simple audio feedback using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    const frequencies = {
      move: 440,
      attack: 220,
      turn: 660,
      research: 880,
      produce: 550
    }
    
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }, [soundEnabled])

  // Check for victory conditions (only after turn 2 to avoid immediate game over)
  useEffect(() => {
    if (gameState.turnNumber > 1) {
      const winner = checkVictoryConditions(hexTiles)
      if (winner) {
        setGameState(prev => ({ ...prev, gameOver: true, winner }))
        playSound(winner === 'player' ? 'research' : 'attack')
      }
    }
  }, [hexTiles, playSound, gameState.turnNumber])

  const selectedTileData = hexTiles.find(tile => tile.id === gameState.selectedTile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            onClick={onBackToMenu}
            variant="ghost"
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Menu
          </Button>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium">{resources.stars}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">{resources.population}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">{resources.science}</span>
            </div>
            <Badge variant={gameState.currentTurn === 'player' ? 'default' : 'secondary'}>
              Turn {gameState.turnNumber} - {isAIThinking ? 'AI Thinking...' : gameState.currentTurn === 'player' ? 'Your Turn' : 'Enemy Turn'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-slate-300"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button 
              onClick={handleEndTurn}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={gameState.currentTurn === 'enemy' || isAIThinking || gameState.gameOver}
            >
              End Turn
            </Button>
          </div>
        </div>
      </div>

      {/* Victory/Game Over Alert */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Alert className="max-w-md bg-slate-800 border-slate-700">
            <Crown className="h-4 w-4" />
            <AlertDescription className="text-white">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold">
                  {gameState.winner === 'player' ? '🎉 Victory!' : '💀 Defeat!'}
                </h3>
                <p>
                  {gameState.winner === 'player' 
                    ? 'Congratulations! You have conquered the battlefield!' 
                    : 'Your forces have been defeated. Better luck next time!'}
                </p>
                <div className="flex space-x-2">
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={onBackToMenu} variant="outline" className="flex-1">
                    Main Menu
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Game Board */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative transform perspective-1000 rotate-x-2">
              <svg 
                width="900" 
                height="700" 
                viewBox="-450 -350 900 700"
                className="border border-slate-700 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-900/50 rounded-lg shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
                  transform: 'rotateX(5deg) rotateY(-2deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
              {/* Enhanced 3D Robot Gradients */}
              <defs>
                {/* Robot chassis gradients with metallic shading */}
                <linearGradient id="robotChassisPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="25%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="75%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <linearGradient id="robotChassisEnemy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="25%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="75%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                
                {/* Robot torso gradients */}
                <linearGradient id="robotTorsoPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="robotTorsoEnemy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                
                {/* Robot head gradients */}
                <linearGradient id="robotHeadPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="robotHeadEnemy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="50%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                
                {/* Robot visor gradients */}
                <linearGradient id="robotVisorDefault" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.8)" />
                  <stop offset="50%" stopColor="rgba(6, 182, 212, 0.9)" />
                  <stop offset="100%" stopColor="rgba(8, 145, 178, 0.8)" />
                </linearGradient>
                <linearGradient id="robotVisorScout" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
                  <stop offset="50%" stopColor="rgba(22, 163, 74, 0.9)" />
                  <stop offset="100%" stopColor="rgba(21, 128, 61, 0.8)" />
                </linearGradient>
                
                {/* Weapon and equipment gradients */}
                <linearGradient id="weaponGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e40af" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                
                {/* Power core and antenna gradients */}
                <radialGradient id="powerCoreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(34, 211, 238, 0.9)" />
                  <stop offset="40%" stopColor="rgba(6, 182, 212, 0.7)" />
                  <stop offset="70%" stopColor="rgba(8, 145, 178, 0.3)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0891b2" />
                </radialGradient>
                
                {/* Health bar gradients */}
                <linearGradient id="healthGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient id="healthGradientYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
                <linearGradient id="healthGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                
                {/* City gradients */}
                <linearGradient id="cityGradientPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="cityGradientEnemy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <linearGradient id="cityGradientNeutral" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              {hexTiles.map((tile) => {
                const { x, y } = hexToPixel(tile.q, tile.r)
                const isSelected = gameState.selectedTile === tile.id
                const isValidMove = gameState.validMoves.includes(tile.id)
                const isValidAttack = gameState.validAttacks.includes(tile.id)
                
                // Hex path
                const hexPath = []
                for (let i = 0; i < 6; i++) {
                  const angle = (Math.PI / 3) * i
                  const hexX = x + 22 * Math.cos(angle)
                  const hexY = y + 22 * Math.sin(angle)
                  hexPath.push(i === 0 ? `M ${hexX} ${hexY}` : `L ${hexX} ${hexY}`)
                }
                hexPath.push('Z')
                
                let fillColor = '#334155' // slate-700
                if (tile.owner === 'player') fillColor = '#1e40af' // blue-700
                if (tile.owner === 'enemy') fillColor = '#dc2626' // red-600
                if (tile.type === 'mountain') fillColor = '#6b7280' // gray-500
                if (tile.type === 'water') fillColor = '#0ea5e9' // sky-500
                if (tile.type === 'forest') fillColor = '#16a34a' // green-600
                if (tile.type === 'city') fillColor = tile.owner === 'player' ? '#2563eb' : tile.owner === 'enemy' ? '#dc2626' : '#8b5cf6'
                
                let strokeColor = '#475569'
                if (isSelected) strokeColor = '#fbbf24'
                if (isValidMove) strokeColor = '#22c55e'
                if (isValidAttack) strokeColor = '#ef4444'
                
                const UnitIcon = tile.unit ? getUnitIcon(tile.unit.type) : null
                
                // Get terrain-specific class
                let terrainClass = ''
                if (tile.type === 'mountain') terrainClass = 'terrain-mountain'
                else if (tile.type === 'water') terrainClass = 'terrain-water'
                else if (tile.type === 'forest') terrainClass = 'terrain-forest'
                else if (tile.type === 'city') terrainClass = 'terrain-city'
                
                return (
                  <g key={tile.id} className={`hex-tile-3d ${isSelected ? 'hex-tile-selected' : ''} ${terrainClass} ${isValidMove ? 'valid-move-glow' : ''} ${isValidAttack ? 'valid-attack-glow' : ''} hex-interactive`}>
                    {/* Main hex tile with 3D gradient effect */}
                    <defs>
                      <linearGradient id={`gradient-${tile.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={fillColor} stopOpacity="1" />
                        <stop offset="50%" stopColor={fillColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={fillColor} stopOpacity="0.6" />
                      </linearGradient>
                      <filter id={`shadow-${tile.id}`}>
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    
                    {/* Base shadow */}
                    <path
                      d={hexPath.join(' ')}
                      fill="rgba(0,0,0,0.2)"
                      transform={`translate(2, 4)`}
                    />
                    
                    {/* Main tile */}
                    <path
                      d={hexPath.join(' ')}
                      fill={`url(#gradient-${tile.id})`}
                      stroke={strokeColor}
                      strokeWidth={isSelected || isValidMove || isValidAttack ? 3 : 1}
                      className="cursor-pointer hover:stroke-slate-400 transition-all"
                      onClick={() => handleTileClick(tile.id)}
                      filter={`url(#shadow-${tile.id})`}
                      style={{
                        filter: isSelected 
                          ? 'drop-shadow(0 6px 12px rgba(59, 130, 246, 0.5))' 
                          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                    
                    {/* Resource indicator with 3D effect */}
                    {tile.resources && tile.resources > 0 && (
                      <g>
                        <circle
                          cx={x + 15}
                          cy={y - 15}
                          r="4"
                          fill="rgba(0,0,0,0.2)"
                          transform="translate(1, 2)"
                        />
                        <circle
                          cx={x + 15}
                          cy={y - 15}
                          r="4"
                          className="resource-indicator-3d"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <text
                          x={x + 15}
                          y={y - 12}
                          textAnchor="middle"
                          fontSize="8"
                          fill="white"
                          fontWeight="bold"
                        >
                          {tile.resources}
                        </text>
                      </g>
                    )}
                    
                    {/* City indicator with enhanced 3D effect */}
                    {tile.type === 'city' && (
                      <g>
                        {/* City shadow */}
                        <rect
                          x={x - 8}
                          y={y - 8}
                          width="16"
                          height="16"
                          fill="rgba(0,0,0,0.3)"
                          rx="2"
                          transform="translate(2, 3)"
                        />
                        {/* City building */}
                        <rect
                          x={x - 8}
                          y={y - 8}
                          width="16"
                          height="16"
                          fill={tile.owner === 'player' ? 'url(#cityGradientPlayer)' : tile.owner === 'enemy' ? 'url(#cityGradientEnemy)' : 'url(#cityGradientNeutral)'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          rx="2"
                          style={{
                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))'
                          }}
                        />
                        {/* City windows */}
                        <rect x={x - 6} y={y - 6} width="2" height="2" fill="rgba(255,255,255,0.8)" rx="0.5" />
                        <rect x={x - 2} y={y - 6} width="2" height="2" fill="rgba(255,255,255,0.8)" rx="0.5" />
                        <rect x={x + 2} y={y - 6} width="2" height="2" fill="rgba(255,255,255,0.8)" rx="0.5" />
                        <rect x={x - 6} y={y - 2} width="2" height="2" fill="rgba(255,255,255,0.8)" rx="0.5" />
                        <rect x={x + 2} y={y - 2} width="2" height="2" fill="rgba(255,255,255,0.8)" rx="0.5" />
                      </g>
                    )}
                    
                    {/* Enhanced 3D Polytopia-Style Robot Unit */}
                    {tile.unit && UnitIcon && (
                      <g className={`unit-3d robot-unit ${isSelected ? 'unit-selected' : ''}`}>
                        {/* Deep unit shadow for 3D depth */}
                        <ellipse
                          cx={x + 3}
                          cy={y + 6}
                          rx="16"
                          ry="8"
                          fill="rgba(0,0,0,0.4)"
                          style={{ filter: 'blur(2px)' }}
                        />
                        
                        {/* Robot chassis base - main body */}
                        <circle
                          cx={x}
                          cy={y}
                          r="16"
                          className={tile.unit.owner === 'player' ? 'robot-chassis-player' : 'robot-chassis-enemy'}
                          style={{
                            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))'
                          }}
                        />
                        
                        {/* Robot armor segments - top panel */}
                        <path
                          d={`M ${x-10} ${y-8} Q ${x} ${y-12} ${x+10} ${y-8} L ${x+8} ${y-4} Q ${x} ${y-6} ${x-8} ${y-4} Z`}
                          className="robot-armor-segments"
                          fill="rgba(255,255,255,0.15)"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="0.5"
                        />
                        
                        {/* Robot side panels */}
                        <rect
                          x={x - 14}
                          y={y - 6}
                          width="4"
                          height="12"
                          className="robot-armor-segments"
                          fill="rgba(255,255,255,0.1)"
                          rx="2"
                        />
                        <rect
                          x={x + 10}
                          y={y - 6}
                          width="4"
                          height="12"
                          className="robot-armor-segments"
                          fill="rgba(0,0,0,0.1)"
                          rx="2"
                        />
                        
                        {/* Robot joints/connectors */}
                        <circle cx={x - 8} cy={y - 8} r="2" className="robot-joints" />
                        <circle cx={x + 8} cy={y - 8} r="2" className="robot-joints" />
                        <circle cx={x - 8} cy={y + 8} r="2" className="robot-joints" />
                        <circle cx={x + 8} cy={y + 8} r="2" className="robot-joints" />
                        
                        {/* Central weapon mount/core */}
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          className="robot-weapon-mount"
                          fill="rgba(255,255,255,0.2)"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="1"
                        />
                        
                        {/* Unit type icon with enhanced 3D effect */}
                        <g style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))' }}>
                          <UnitIcon 
                            x={x - 6} 
                            y={y - 6} 
                            width="12" 
                            height="12" 
                            fill="white"
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth="0.5"
                          />
                        </g>
                        
                        {/* Robot energy core glow */}
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill={`url(#energyCore${tile.unit.owner === 'player' ? 'Player' : 'Enemy'})`}
                          style={{
                            filter: `drop-shadow(0 0 8px ${tile.unit.owner === 'player' ? 'rgb(59 130 246 / 90%)' : 'rgb(239 68 68 / 90%)'})`
                          }}
                        />
                        
                        {/* Enhanced 3D Health bar with depth */}
                        <g>
                          {/* Health bar shadow */}
                          <rect
                            x={x - 14}
                            y={y + 22}
                            width="28"
                            height="4"
                            fill="rgba(0,0,0,0.4)"
                            rx="2"
                          />
                          {/* Health bar background with 3D effect */}
                          <rect
                            x={x - 14}
                            y={y + 20}
                            width="28"
                            height="4"
                            className="health-bar-3d"
                            rx="2"
                            style={{
                              filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))'
                            }}
                          />
                          {/* Health bar fill with gradient */}
                          <rect
                            x={x - 14}
                            y={y + 20}
                            width={28 * (tile.unit.health / tile.unit.maxHealth)}
                            height="4"
                            fill={`url(#healthGradient${tile.unit.health > tile.unit.maxHealth * 0.6 ? 'Green' : 
                                  tile.unit.health > tile.unit.maxHealth * 0.3 ? 'Yellow' : 'Red'})`}
                            className="health-fill-3d"
                            rx="2"
                          />
                          {/* Health bar highlight */}
                          <rect
                            x={x - 14}
                            y={y + 20}
                            width={28 * (tile.unit.health / tile.unit.maxHealth)}
                            height="1"
                            fill="rgba(255,255,255,0.4)"
                            rx="2"
                          />
                        </g>
                        
                        {/* Enhanced Level indicator with 3D badge */}
                        {tile.unit.level > 1 && (
                          <g>
                            {/* Level badge shadow */}
                            <circle
                              cx={x + 15}
                              cy={y - 12}
                              r="7"
                              fill="rgba(0,0,0,0.4)"
                            />
                            {/* Level badge background */}
                            <circle
                              cx={x + 14}
                              cy={y - 14}
                              r="7"
                              className="level-indicator-3d"
                              stroke="#ffffff"
                              strokeWidth="2"
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
                              }}
                            />
                            {/* Level badge inner glow */}
                            <circle
                              cx={x + 14}
                              cy={y - 14}
                              r="4"
                              fill="rgba(255,255,255,0.3)"
                            />
                            <text
                              x={x + 14}
                              y={y - 10}
                              textAnchor="middle"
                              fontSize="9"
                              fill="white"
                              fontWeight="bold"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))'
                              }}
                            >
                              {tile.unit.level}
                            </text>
                          </g>
                        )}
                        
                        {/* Robot status indicators */}
                        {tile.unit.hasActed && (
                          <circle
                            cx={x - 12}
                            cy={y - 12}
                            r="3"
                            fill="rgba(156, 163, 175, 0.8)"
                            stroke="white"
                            strokeWidth="1"
                            style={{
                              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))'
                            }}
                          />
                        )}
                      </g>
                    )}
                    
                    {/* Enhanced gradients for 3D Polytopia-style effects */}
                    <defs>
                      {/* Health bar gradients */}
                      <linearGradient id="healthGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="healthGradientYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#ca8a04" />
                      </linearGradient>
                      <linearGradient id="healthGradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="50%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      
                      {/* City gradients with enhanced 3D effect */}
                      <linearGradient id="cityGradientPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#93c5fd" />
                        <stop offset="30%" stopColor="#60a5fa" />
                        <stop offset="70%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="cityGradientEnemy" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="30%" stopColor="#f87171" />
                        <stop offset="70%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="cityGradientNeutral" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="30%" stopColor="#a78bfa" />
                        <stop offset="70%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      
                      {/* Robot chassis metallic effects */}
                      <radialGradient id="robotMetallicHighlight" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                        <stop offset="40%" stopColor="rgba(255,255,255,0.3)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                      </radialGradient>
                      
                      {/* Energy core glow effects */}
                      <radialGradient id="energyCorePlayer" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(147, 197, 253, 0.9)" />
                        <stop offset="50%" stopColor="rgba(59, 130, 246, 0.7)" />
                        <stop offset="100%" stopColor="rgba(29, 78, 216, 0.5)" />
                      </radialGradient>
                      <radialGradient id="energyCoreEnemy" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(252, 165, 165, 0.9)" />
                        <stop offset="50%" stopColor="rgba(239, 68, 68, 0.7)" />
                        <stop offset="100%" stopColor="rgba(185, 28, 28, 0.5)" />
                      </radialGradient>
                    </defs>
                  </g>
                )
              })}
              </svg>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-slate-800/50 border-l border-slate-700 p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Game Control</h3>
            <div className="flex space-x-1">
              <TechnologyTree 
                researchedTechs={researchedTechs}
                currentScience={resources.science}
                onResearchTechnology={handleResearchTechnology}
              />
              <UnitProduction
                availableUnits={getAvailableUnits()}
                currentStars={resources.stars}
                onProduceUnit={handleProduceUnit}
                selectedTileId={selectedTileData?.type === 'city' && selectedTileData?.owner === 'player' ? gameState.selectedTile : null}
              />
            </div>
          </div>
          
          {/* Selected Tile Info */}
          {selectedTileData && (
            <Card className="bg-slate-700/50 border-slate-600 p-4">
              <h4 className="font-medium text-white mb-2">Selected Tile</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white capitalize">{selectedTileData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Owner:</span>
                  <span className="text-white capitalize">{selectedTileData.owner}</span>
                </div>
                {selectedTileData.resources && selectedTileData.resources > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resources:</span>
                    <span className="text-amber-400">{selectedTileData.resources}</span>
                  </div>
                )}
                
                {selectedTileData.unit && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <h5 className="font-medium text-white mb-2">Unit</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <span className="text-white capitalize">{selectedTileData.unit.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Level:</span>
                        <span className="text-yellow-400">{selectedTileData.unit.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Health:</span>
                        <span className="text-green-400">{selectedTileData.unit.health}/{selectedTileData.unit.maxHealth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attack:</span>
                        <span className="text-red-400">{selectedTileData.unit.attack}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Defense:</span>
                        <span className="text-blue-400">{selectedTileData.unit.defense}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Movement:</span>
                        <span className="text-yellow-400">{selectedTileData.unit.movement}</span>
                      </div>
                      {selectedTileData.unit.abilities.length > 0 && (
                        <div className="mt-2">
                          <span className="text-slate-400 text-xs">Abilities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTileData.unit.abilities.map(ability => (
                              <Badge key={ability} variant="secondary" className="text-xs">
                                {ability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Action Panel */}
          <Card className="bg-slate-700/50 border-slate-600 p-4">
            <h4 className="font-medium text-white mb-3">Actions</h4>
            <div className="space-y-2">
              <div className="text-xs text-slate-400 space-y-1">
                <p>• Click unit to select</p>
                <p>• Green tiles = valid moves</p>
                <p>• Red tiles = attack targets</p>
                <p>• Cities can produce units</p>
              </div>
              
              {gameState.validMoves.length > 0 && (
                <div className="text-xs text-green-400">
                  {gameState.validMoves.length} moves available
                </div>
              )}
              
              {gameState.validAttacks.length > 0 && (
                <div className="text-xs text-red-400">
                  {gameState.validAttacks.length} attacks available
                </div>
              )}
            </div>
          </Card>

          {/* Combat Log */}
          {combatLog.length > 0 && (
            <Card className="bg-slate-700/50 border-slate-600 p-4">
              <h4 className="font-medium text-white mb-2">Combat Log</h4>
              <div className="space-y-1 text-xs">
                {combatLog.map((log, index) => (
                  <div key={index} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Victory Conditions */}
          <Card className="bg-slate-700/50 border-slate-600 p-4">
            <h4 className="font-medium text-white mb-2">Victory Conditions</h4>
            <div className="text-sm text-slate-400 space-y-1">
              <p>• Eliminate all enemy units</p>
              <p>• Control 75% of territory</p>
              <p>• Capture enemy cities</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GameBoard