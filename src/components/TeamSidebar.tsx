import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { api } from '../lib/axios';
import { useState, useEffect } from 'react';

interface Team {
  id: number;
  name: string;
}

interface TeamSidebarProps {
  teamId: string;
  activeTab: 'matches' | 'players' | 'actions';
}

export default function TeamSidebar({ teamId, activeTab }: TeamSidebarProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      console.log(window.innerWidth);
      if (window.innerWidth <= 768) {
        console.log('isfalse')
        setIsExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: team } = useQuery<Team>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const response = await api.get(`/team/${teamId}`);
      return response.data;
    },
  });

  const tabs = [
    {
      id: 'matches',
      name: 'Matches',
      icon: Trophy,
      path: `/team/${teamId}/matches`
    },
    {
      id: 'players',
      name: 'Players',
      icon: Users,
      path: `/team/${teamId}/players`
    },
    {
      id: 'actions',
      name: 'Actions',
      icon: Settings,
      path: `/team/${teamId}/actions`
    }
  ];

  return (
    <div 
      className={`
        ${isExpanded ? 'w-64' : 'w-20'} 
        bg-white border-r border-gray-200 
        transition-all duration-200 relative group
        min-h-screen flex flex-col
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-4 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition-shadow z-50"
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      <div className="p-4 flex-1">
        
        {/* Team Name */}
        <h2 className={`font-medium mb-6 truncate transition-all duration-200 ${
          isExpanded ? 'text-xl px-1' : 'text-sm text-center'
        }`}>
          {isExpanded ? team?.name : team?.name?.[0]}
        </h2>

        {/* Navigation */}
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  w-full flex items-center gap-3 
                  px-3 py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600'
                  }
                `}
                title={!isExpanded ? tab.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`truncate transition-all duration-200 ${
                  isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                }`}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hover Tooltips for Collapsed State */}
      {!isExpanded && (
        <div className="fixed left-16 top-0 hidden z-50">
          <div className="py-2 ml-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`
                  whitespace-nowrap px-3 py-2 text-sm rounded-lg
                  shadow-lg border border-gray-100
                  ${activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600'
                  }
                `}
                style={{
                  visibility: activeTab === tab.id ? 'visible' : 'hidden',
                  marginTop: '24px'
                }}
              >
                {tab.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}