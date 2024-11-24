import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useState } from 'react';
import { Users, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import PlayerCard from '../components/PlayerCard';

interface Match {
  id: number;
  name: string;
}

interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
}

type PlayerList = 'starters' | 'substitutes';

function DroppableArea({ id, children }: { id: PlayerList; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-[200px] p-4 space-y-2">
      {children}
    </div>
  );
}

export default function MatchLineup() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [starters, setStarters] = useState<Player[]>([]);
  const [substitutes, setSubstitutes] = useState<Player[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<PlayerList | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: match } = useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await api.get(`/match/${matchId}`);
      return response.data;
    },
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: async () => {
      // Replace with actual API call when available
      return [
        { id: 1, name: 'John Smith', number: '10', position: 'Forward' },
        { id: 2, name: 'David Wilson', number: '1', position: 'Goalkeeper' },
        { id: 3, name: 'Michael Brown', number: '4', position: 'Defender' },
        { id: 4, name: 'James Davis', number: '8', position: 'Midfielder' },
        { id: 5, name: 'Robert Taylor', number: '7', position: 'Forward' },
        { id: 6, name: 'William Moore', number: '6', position: 'Midfielder' }
      ].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as number);
    
    if (starters.find(p => p.id === active.id)) {
      setActiveList('starters');
    } else if (substitutes.find(p => p.id === active.id)) {
      setActiveList('substitutes');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const playerId = active.id as number;
    const player = [...starters, ...substitutes].find(p => p.id === playerId);
    
    if (!player) return;

    const targetList = over.id as PlayerList;
    const sourceList = activeList;

    if (sourceList === targetList) return;

    // Remove from source list
    if (sourceList === 'starters') {
      setStarters(prev => prev.filter(p => p.id !== playerId));
    } else if (sourceList === 'substitutes') {
      setSubstitutes(prev => prev.filter(p => p.id !== playerId));
    }

    // Add to target list
    if (targetList === 'starters') {
      if (starters.length < 11) {
        setStarters(prev => [...prev, player]);
      } else {
        setSubstitutes(prev => [...prev, player]);
        toast.error('Starting lineup is limited to 11 players');
      }
    } else if (targetList === 'substitutes') {
      setSubstitutes(prev => [...prev, player]);
    }

    setActiveId(null);
    setActiveList(null);
  };

  const handleAddPlayer = (player: Player, targetList: PlayerList = 'starters') => {
    if (targetList === 'starters' && starters.length < 11) {
      setStarters(prev => [...prev, player]);
    } else {
      setSubstitutes(prev => [...prev, player]);
      if (targetList === 'starters') {
        toast.error('Starting lineup is limited to 11 players');
      }
    }
  };

  const handleRemovePlayer = (player: Player, list: PlayerList) => {
    if (list === 'starters') {
      setStarters(prev => prev.filter(p => p.id !== player.id));
    } else {
      setSubstitutes(prev => prev.filter(p => p.id !== player.id));
    }
  };

  const isPlayerSelected = (playerId: number) => {
    return starters.some(p => p.id === playerId) || substitutes.some(p => p.id === playerId);
  };

  const activePlayer = activeId ? [...starters, ...substitutes].find(p => p.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-black mb-4"
          >
            ← Back to Match
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-xl font-medium">{match?.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Select players for the match</p>
            </div>
            <button
              onClick={() => {
                // TODO: Save lineup
                toast.success('Lineup saved successfully');
                navigate(-1);
              }}
              disabled={starters.length !== 11}
              className="btn flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Save Lineup ({starters.length}/11)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Players */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Available Players</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {players?.map((player) => (
                  <div
                    key={player.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      isPlayerSelected(player.id) ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {player.number}
                        </div>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-gray-500">{player.position}</p>
                        </div>
                      </div>
                      {!isPlayerSelected(player.id) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddPlayer(player, 'starters')}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            title="Add to starting lineup"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAddPlayer(player, 'substitutes')}
                            className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                            title="Add to substitutes"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {!players?.length && (
                  <div className="p-4 text-center text-gray-500">
                    No players available. Add players to the team first.
                  </div>
                )}
              </div>
            </div>

            {/* Starting Lineup */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Starting Lineup ({starters.length}/11)</h2>
              </div>
              <SortableContext
                items={starters.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableArea id="starters">
                  {starters.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onRemove={() => handleRemovePlayer(player, 'starters')}
                    />
                  ))}
                  {!starters.length && (
                    <div className="text-center py-8 text-gray-500">
                      Drag players here or use the arrow button to add them to the starting lineup
                    </div>
                  )}
                </DroppableArea>
              </SortableContext>
            </div>

            {/* Substitutes */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Substitutes ({substitutes.length})</h2>
              </div>
              <SortableContext
                items={substitutes.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableArea id="substitutes">
                  {substitutes.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onRemove={() => handleRemovePlayer(player, 'substitutes')}
                    />
                  ))}
                  {!substitutes.length && (
                    <div className="text-center py-8 text-gray-500">
                      Drag players here or use the arrow button to add them to the substitutes bench
                    </div>
                  )}
                </DroppableArea>
              </SortableContext>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activePlayer ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                  {activePlayer.number}
                </div>
                <div>
                  <p className="font-medium">{activePlayer.name}</p>
                  <p className="text-sm text-gray-500">{activePlayer.position}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </main>
    </DndContext>
  );
}