import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useState, useEffect } from 'react';
import { Users, ArrowRight } from 'lucide-react';
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
  total_minutes: number;
}

interface LineupWithPlayer {
  is_starter: boolean;
  id: number;
  match: number;
  player: Player;
  created_at: string;
  updated_at: string;
  updated_by: number;
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
  const queryParams = new URLSearchParams(location.search);
  const teamId = queryParams.get('teamId');
  const navigate = useNavigate();
  const [starters, setStarters] = useState<LineupWithPlayer[]>([]);
  const [substitutes, setSubstitutes] = useState<LineupWithPlayer[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<PlayerList | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineups, setLineups] = useState<LineupWithPlayer[]>([]);

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

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.get(`/player?team=${teamId}`);
        setPlayers(response.data);
      } catch (error) {
        toast.error('Failed to fetch players');
      }
    };

    fetchPlayers();
  }, [teamId]);

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        const response = await api.get(`/lineup?match=${matchId}`);
        const lineupsData = response.data as LineupWithPlayer[];
        setLineups(lineupsData);

        const starters = lineupsData.filter(lineup => lineup.is_starter);
        const substitutes = lineupsData.filter(lineup => !lineup.is_starter);

        setStarters(starters);
        setSubstitutes(substitutes);
      } catch (error) {
        toast.error('Failed to fetch lineup');
      }
    };

    fetchLineup();
  }, [matchId]);

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

  const handleAddPlayer = async (player: Player, targetList: PlayerList) => {
    try {
      const isStarter = targetList === 'starters';
      const response = await api.post('/lineup', {
        match: Number(matchId), // ID del partido
        player: player.id, // ID del jugador
        is_starter: isStarter, // Estado del jugador
      });

      const newLineup: LineupWithPlayer = {
        id: response.data.id, // ID devuelto por el backend
        match: Number(matchId), // ID del partido
        player: player, // Información del jugador
        is_starter: isStarter, // Estado del jugador
        created_at: new Date().toISOString(), // Fecha de creación
        updated_at: new Date().toISOString(), // Fecha de actualización
        updated_by: 1, // ID del usuario que actualiza (ajusta según tu lógica)
      };

      setLineups(prev => [...prev, newLineup]); // Añadir a la lista de lineups

      // Actualizar el estado de starters o substitutes
      if (isStarter) {
        setStarters(prev => [...prev, newLineup]);
      } else {
        setSubstitutes(prev => [...prev, newLineup]);
      }
    } catch (error) {
      toast.error('Failed to add player to lineup');
    }
  };

  const handleRemovePlayer = async (lineupId: number) => {
    try {
      await api.delete(`/lineup/${lineupId}`); // Suponiendo que el endpoint para eliminar es /lineup/{id}
      
      // Actualizar el estado local para eliminar el lineup
      setLineups(prev => prev.filter(lineup => lineup.id !== lineupId)); // Eliminar de lineups

      // También puedes actualizar starters y substitutes si es necesario
      setStarters(prev => prev.filter(lineup => lineup.id !== lineupId));
      setSubstitutes(prev => prev.filter(lineup => lineup.id !== lineupId));
    } catch (error) {
      toast.error('Failed to remove player from lineup');
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

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-xl font-medium">{match?.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Players */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-medium">Available Players</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {players
                  ?.filter(player => 
                    !lineups.some(lineup => lineup.player.id === player.id) // Filtrar jugadores ya en lineups
                  )
                  .map((player) => (
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
                            <p className="text-sm text-gray-500">{player.total_minutes} min</p>
                          </div>
                        </div>
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
                      </div>
                    </div>
                  ))}
                {(!players || players.length === 0) && (
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
                  {starters.map((lineup) => (
                    <PlayerCard
                      key={lineup.id}
                      player={lineup.player}
                      onRemove={() => handleRemovePlayer(lineup.id)}
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
                  {substitutes.map((lineup) => (
                    <PlayerCard
                      key={lineup.id}
                      player={lineup.player}
                      onRemove={() => handleRemovePlayer(lineup.id)}
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
                  {activePlayer.player.number}
                </div>
                <div>
                  <p className="font-medium">{activePlayer.player.name}</p>
                  <p className="text-sm text-gray-500">{activePlayer.player.position}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </main>
    </DndContext>
  );
}