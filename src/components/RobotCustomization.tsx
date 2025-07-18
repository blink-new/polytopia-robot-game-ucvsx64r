import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft } from 'lucide-react'
import { unitData, getUnitIcon } from '../data/units'

interface RobotCustomizationProps {
  onSkinSelected: (skin: string) => void
  onBackToMenu: () => void
}

// Get basic robot types for customization
const basicRobotTypes = ['warrior', 'scout', 'defender'] as const

const robotSkins = basicRobotTypes.map(type => {
  const data = unitData[type]
  return {
    id: type,
    name: data.name,
    icon: getUnitIcon(type),
    color: data.color,
    stats: { 
      attack: data.attack, 
      defense: data.defense, 
      movement: data.movement 
    },
    description: data.description
  }
})

const RobotCustomization: React.FC<RobotCustomizationProps> = ({ onSkinSelected, onBackToMenu }) => {
  const [selectedSkin, setSelectedSkin] = useState('warrior')

  const handleSelectSkin = (skinId: string) => {
    setSelectedSkin(skinId)
  }

  const handleStartWithSkin = () => {
    onSkinSelected(selectedSkin)
  }

  const selectedRobot = robotSkins.find(robot => robot.id === selectedSkin)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={onBackToMenu}
            variant="ghost"
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-bold text-white">Robot Customization</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Robot Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Choose Your Robot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {robotSkins.map((robot) => {
                const IconComponent = robot.icon
                return (
                  <Card 
                    key={robot.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      selectedSkin === robot.id 
                        ? 'border-blue-400 bg-slate-700/50' 
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                    onClick={() => handleSelectSkin(robot.id)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${robot.color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{robot.name}</h3>
                        <p className="text-xs text-slate-400">{robot.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        ATK: {robot.stats.attack}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        DEF: {robot.stats.defense}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        MOV: {robot.stats.movement}
                      </Badge>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Selected Robot Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Robot</h3>
              
              {selectedRobot && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${selectedRobot.color}`}>
                      <selectedRobot.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{selectedRobot.name}</h4>
                      <p className="text-sm text-slate-400">{selectedRobot.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-slate-300">Combat Stats</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Attack</span>
                        <span className="text-red-400">{selectedRobot.stats.attack}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Defense</span>
                        <span className="text-blue-400">{selectedRobot.stats.defense}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Movement</span>
                        <span className="text-green-400">{selectedRobot.stats.movement}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Button 
              onClick={handleStartWithSkin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              size="lg"
            >
              Start Game with {selectedRobot?.name}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RobotCustomization