import React, { useState } from 'react'
import './App.css'
import GameBoard from './components/GameBoard'
import MainMenu from './components/MainMenu'
import RobotCustomization from './components/RobotCustomization'

type GameState = 'menu' | 'customization' | 'playing'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedRobotSkin, setSelectedRobotSkin] = useState('warrior')

  const handleStartGame = () => {
    setGameState('playing')
  }

  const handleCustomizeRobots = () => {
    setGameState('customization')
  }

  const handleBackToMenu = () => {
    setGameState('menu')
  }

  const handleSkinSelected = (skin: string) => {
    setSelectedRobotSkin(skin)
    setGameState('playing')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {gameState === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame}
          onCustomizeRobots={handleCustomizeRobots}
        />
      )}
      
      {gameState === 'customization' && (
        <RobotCustomization 
          onSkinSelected={handleSkinSelected}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {gameState === 'playing' && (
        <GameBoard 
          robotSkin={selectedRobotSkin}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}

export default App