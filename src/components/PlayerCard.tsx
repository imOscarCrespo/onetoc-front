import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  number: string;
  position: string;
}

interface PlayerCardProps {
  player: Player;
  onRemove: () => void;
}

export default function PlayerCard({ player, onRemove }: PlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:border-black transition-colors"
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
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Remove from lineup"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}