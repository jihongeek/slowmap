'use client';

import { RouteData, Waypoint } from '@/types/route';
import { MapView } from './MapView';

interface MapContainerProps {
  routeData: RouteData | null;
  selectedWaypoint?: Waypoint | null;
  onWaypointClick?: (wp: Waypoint | null) => void;
}

export function MapContainer({ routeData, selectedWaypoint, onWaypointClick }: MapContainerProps) {
  const mapKey = routeData?.routeId ?? 'initial-map';

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 overflow-hidden rounded-none sm:rounded-xl border">
      {/* 실제 지도 영역 */}
      <div className="absolute inset-0">
        <MapView
          key={mapKey}
          routeData={routeData}
          selectedWaypoint={selectedWaypoint}
          onWaypointClick={onWaypointClick}
        />
      </div>
    </div>
  );
}
