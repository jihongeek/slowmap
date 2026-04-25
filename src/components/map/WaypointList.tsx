'use client';

import { Badge } from '@/components/ui/badge';
import { Waypoint } from '@/types/route';
import { MapPin, MapPinOff, Navigation2, Cat, Sunset, Mountain, Flower2, Waves, Droplets } from 'lucide-react';

interface WaypointListProps {
  waypoints: Waypoint[];
  onWaypointClick?: (wp: Waypoint) => void;
}

export function WaypointList({ waypoints, onWaypointClick }: WaypointListProps) {
  if (!waypoints || waypoints.length === 0) return null;

  const getIcon = (type: Waypoint['type']) => {
    switch (type) {
      case 'origin':
        return <Navigation2 className="w-5 h-5 text-emerald-600" />;
      case 'destination':
        return <MapPin className="w-5 h-5 text-emerald-600" />;
      case 'stopover':
        return <MapPinOff className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBadgeColor = (type: Waypoint['type']) => {
    switch (type) {
      case 'origin':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200';
      case 'destination':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200';
      case 'stopover':
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200';
    }
  };

  const getLabel = (type: Waypoint['type']) => {
    switch (type) {
      case 'origin':
        return '출발';
      case 'destination':
        return '도착';
      case 'stopover':
        return '경유';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {waypoints.map((wp, index) => (
        <div 
          key={wp.id} 
          className="flex items-start gap-3 relative cursor-pointer hover:bg-gray-100 p-2 -mx-2 rounded-lg transition-colors"
          onClick={() => onWaypointClick?.(wp)}
        >
          {/* Connecting line */}
          {index < waypoints.length - 1 && (
            <div className="absolute left-4 top-9 bottom-[-16px] w-0.5 bg-emerald-200" />
          )}
          
          <div className="mt-1 bg-white z-10 rounded-full">
            {getIcon(wp.type)}
          </div>
          
          <div className="flex flex-col flex-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{wp.name}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${getBadgeColor(wp.type)}`}>
                {getLabel(wp.type)}
              </Badge>
              {wp.scores && (
                <span className="text-xs font-semibold text-green-600 ml-auto">
                  여유 점수: {wp.scores.totalScore}점
                </span>
              )}
            </div>
            
            {wp.description && (
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {wp.description}
              </p>
            )}

            {wp.scores ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {wp.scores.cats > 0 && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Cat className="w-3 h-3" />
                    고양이 {wp.scores.cats}마리
                  </Badge>
                )}
                {wp.scores.scenery.sunset && (
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Sunset className="w-3 h-3" />
                    노을
                  </Badge>
                )}
                {wp.scores.scenery.mountain && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Mountain className="w-3 h-3" />
                    산
                  </Badge>
                )}
                {wp.scores.scenery.flower && (
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Flower2 className="w-3 h-3" />
                    꽃
                  </Badge>
                )}
                {wp.scores.scenery.river && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Waves className="w-3 h-3" />
                    강
                  </Badge>
                )}
                {wp.scores.scenery.sea && (
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Waves className="w-3 h-3" />
                    바다
                  </Badge>
                )}
                {wp.scores.scenery.stream && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] flex items-center gap-1 px-1.5 py-0.5">
                    <Droplets className="w-3 h-3" />
                    하천
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 animate-pulse">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                장소 분석 중...
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
