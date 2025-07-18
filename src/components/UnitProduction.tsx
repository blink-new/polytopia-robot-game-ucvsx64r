import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { UnitType } from '../types/game'
import { unitData, getUnitIcon, getUnitColor } from '../data/units'
import { Plus, Star } from 'lucide-react'

interface UnitProductionProps {
  availableUnits: UnitType[]
  currentStars: number
  onProduceUnit: (unitType: UnitType) => void
  selectedTileId: string | null
}

const UnitProduction: React.FC<UnitProductionProps> = ({
  availableUnits,
  currentStars,
  onProduceUnit,
  selectedTileId
}) => {
  const canProduce = (unitType: UnitType): boolean => {
    const unit = unitData[unitType]
    return unit && currentStars >= unit.cost
  }

  const renderUnit = (unitType: UnitType) => {
    const unit = unitData[unitType]
    if (!unit) return null

    const UnitIcon = getUnitIcon(unitType)
    const affordable = canProduce(unitType)

    return (
      <Card
        key={unitType}
        className={`p-4 transition-all ${
          affordable
            ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
            : 'border-gray-600 bg-gray-600/10 opacity-50'
        }`}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 rounded-lg ${unit.color}`}>
            <UnitIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white text-sm">{unit.name}</h4>
            <p className="text-xs text-slate-400">{unit.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-xs">
            <span className="text-slate-400">Health:</span>
            <span className="text-green-400 ml-1">{unit.health}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400">Attack:</span>
            <span className="text-red-400 ml-1">{unit.attack}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400">Defense:</span>
            <span className="text-blue-400 ml-1">{unit.defense}</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-400">Movement:</span>
            <span className="text-yellow-400 ml-1">{unit.movement}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs flex items-center">
            <Star className="w-3 h-3 mr-1" />
            {unit.cost}
          </Badge>
          
          <Button
            size="sm"
            onClick={() => onProduceUnit(unitType)}
            disabled={!affordable || !selectedTileId}
            className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
          >
            <Plus className="w-3 h-3 mr-1" />
            Train
          </Button>
        </div>

        {unit.abilities.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            <p className="text-xs text-slate-500">
              Abilities: {unit.abilities.join(', ')}
            </p>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-slate-600 text-slate-200"
          disabled={!selectedTileId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Train Units
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Unit Production
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">
              Available Stars: <span className="text-amber-400 font-semibold">{currentStars}</span>
            </p>
            {!selectedTileId && (
              <p className="text-red-400 text-sm">Select a city to train units</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableUnits.map(renderUnit)}
          </div>
          
          {availableUnits.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No units available for production.</p>
              <p className="text-slate-500 text-sm mt-1">Research new technologies to unlock more units.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UnitProduction