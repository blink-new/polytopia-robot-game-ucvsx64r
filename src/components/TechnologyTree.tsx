import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { technologies } from '../data/technologies'
import { Crown, Lock, CheckCircle } from 'lucide-react'

interface TechnologyTreeProps {
  researchedTechs: string[]
  currentScience: number
  onResearchTechnology: (techId: string) => void
}

const TechnologyTree: React.FC<TechnologyTreeProps> = ({
  researchedTechs,
  currentScience,
  onResearchTechnology
}) => {
  const [open, setOpen] = useState(false)

  const canResearch = (techId: string): boolean => {
    const tech = technologies.find(t => t.id === techId)
    if (!tech || researchedTechs.includes(techId)) return false
    
    // Check if all prerequisites are met
    return tech.prerequisites.every(prereq => researchedTechs.includes(prereq))
  }

  const getTechStatus = (techId: string): 'researched' | 'available' | 'locked' => {
    if (researchedTechs.includes(techId)) return 'researched'
    if (canResearch(techId)) return 'available'
    return 'locked'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-600 text-slate-200">
          <Crown className="w-4 h-4 mr-1" />
          Tech
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Technology Tree</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Science Available: <span className="text-purple-400 font-medium">{currentScience}</span>
            </div>
            <div className="text-sm text-slate-400">
              Researched: <span className="text-green-400 font-medium">{researchedTechs.length}</span>/{technologies.length}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {technologies.map((tech) => {
              const status = getTechStatus(tech.id)
              const canAfford = currentScience >= tech.cost
              
              return (
                <Card 
                  key={tech.id} 
                  className={`p-4 border transition-all ${
                    status === 'researched' 
                      ? 'bg-green-900/20 border-green-600' 
                      : status === 'available' 
                        ? 'bg-slate-700/50 border-slate-600 hover:border-purple-500' 
                        : 'bg-slate-800/50 border-slate-700 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{tech.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{tech.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {status === 'researched' && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        {status === 'locked' && (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Cost:</span>
                        <Badge variant={canAfford ? 'default' : 'secondary'} className="text-xs">
                          {tech.cost} Science
                        </Badge>
                      </div>
                      
                      {tech.prerequisites.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-400">Requires:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tech.prerequisites.map(prereq => {
                              const prereqTech = technologies.find(t => t.id === prereq)
                              const isResearched = researchedTechs.includes(prereq)
                              return (
                                <Badge 
                                  key={prereq} 
                                  variant={isResearched ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {prereqTech?.name || prereq}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {tech.unlocks.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-400">Unlocks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tech.unlocks.map(unlock => (
                              <Badge key={unlock} variant="outline" className="text-xs">
                                {unlock.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {status === 'available' && (
                      <Button
                        onClick={() => {
                          onResearchTechnology(tech.id)
                          if (researchedTechs.length + 1 === technologies.length) {
                            setOpen(false)
                          }
                        }}
                        disabled={!canAfford}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        size="sm"
                      >
                        Research
                      </Button>
                    )}
                    
                    {status === 'researched' && (
                      <div className="text-center text-xs text-green-400 font-medium">
                        ✓ Researched
                      </div>
                    )}
                    
                    {status === 'locked' && (
                      <div className="text-center text-xs text-slate-500">
                        Prerequisites not met
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TechnologyTree