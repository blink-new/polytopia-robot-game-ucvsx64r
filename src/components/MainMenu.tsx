import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Zap, Settings, Play } from 'lucide-react'

interface MainMenuProps {
  onStartGame: () => void
  onCustomizeRobots: () => void
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onCustomizeRobots }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Game Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              Polytopia
            </h1>
          </div>
          <h2 className="text-xl text-slate-300 font-medium">Robot Warfare</h2>
          <p className="text-slate-400 text-sm">
            Command your robot army in tactical hex-based combat
          </p>
        </div>

        {/* Menu Options */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-4">
          <Button 
            onClick={onStartGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-lg"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
          
          <Button 
            onClick={onCustomizeRobots}
            variant="outline"
            className="w-full border-slate-600 text-slate-200 hover:bg-slate-700 font-medium py-3"
            size="lg"
          >
            <Settings className="w-5 h-5 mr-2" />
            Customize Robots
          </Button>
        </Card>

        {/* Game Info */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Turn-based strategy • Resource management</p>
          <p>Territory conquest • Robot customization</p>
        </div>
      </div>
    </div>
  )
}

export default MainMenu