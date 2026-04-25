'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Waypoint } from '@/types/route';
import { MapPin, MapPinOff, Navigation2 } from 'lucide-react';

interface WaypointPanelProps {
  waypoints: Waypoint[];
}

export function WaypointPanel({ waypoints }: WaypointPanelProps) {
  if (!waypoints || waypoints.length === 0) return null;

  const getIcon = (type: Waypoint['type']) => {
    switch (type) {
      case 'origin':
        return <Navigation2 className="w-4 h-4 text-emerald-600" />;
      case 'destination':
        return <MapPin className="w-4 h-4 text-emerald-600" />;
      case 'stopover':
        return <MapPinOff className="w-4 h-4 text-emerald-400" />;
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
    <Card className="absolute top-4 right-4 w-64 shadow-lg bg-white/95 backdrop-blur-sm z-10">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700">경유 장소</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[200px] w-full pr-4">
          <div className="flex flex-col gap-3">
            {waypoints.map((wp, index) => (
              <div key={wp.id} className="flex items-start gap-3 relative">
                {/* Connecting line */}
                {index < waypoints.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-[-12px] w-0.5 bg-emerald-200" />
                )}
                
                <div className="mt-1 bg-white z-10 rounded-full">
                  {getIcon(wp.type)}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{wp.name}</span>
                  <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 h-4 ${getBadgeColor(wp.type)}`}>
                    {getLabel(wp.type)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
