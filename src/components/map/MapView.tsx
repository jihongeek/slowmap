'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { RouteData, Waypoint } from '@/types/route';

interface MapViewProps {
  routeData: RouteData | null;
  selectedWaypoint?: Waypoint | null;
  onWaypointClick?: (wp: Waypoint | null) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

export function MapView({ routeData, selectedWaypoint, onWaypointClick }: MapViewProps) {
  // 구글맵 스크립트 로드
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  });

  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울시청 기본값
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
          
          // 경로 데이터가 없을 때만 현재 위치로 중심 이동
          if (!routeData) {
            setCenter(pos);
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          // 에러 발생 시 기본값(서울시청) 유지
        }
      );
    }
  }, [routeData]);

  // 경로 데이터가 업데이트되면 해당 경로의 출발지로 중심 이동
  useEffect(() => {
    if (routeData && routeData.waypoints.length > 0) {
      setCenter(routeData.waypoints[0].location);
      onWaypointClick?.(null); // 경로가 바뀌면 선택된 마커 초기화
    }
  }, [routeData, onWaypointClick]);

  if (loadError) return <div className="w-full h-full flex items-center justify-center bg-gray-100">지도를 불러올 수 없습니다.</div>;
  if (!isLoaded) return <div className="w-full h-full flex items-center justify-center bg-gray-100">지도 로딩 중...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      options={{
        disableDefaultUI: true, // 기본 UI 숨기기
        zoomControl: true,      // 줌 컨트롤만 표시
      }}
    >
      {/* 현재 내 위치 마커 (초록색 점) */}
      {currentLocation && !routeData && (
        <Marker
          position={currentLocation}
          title="현재 위치"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981', // Tailwind emerald-500
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
      )}

      {routeData && (
        <>
          {/* 폴리라인 (경로 선) */}
          {routeData.path.length > 0 && (
            <Polyline
              path={routeData.path}
              options={{
                strokeColor: '#059669', // Tailwind emerald-600 (진한 초록색)
                strokeOpacity: 0.8,
                strokeWeight: 6,
              }}
            />
          )}

          {/* 마커 (출발, 도착, 경유지) */}
          {routeData.waypoints.map((wp, index) => {
            // 마커 이미지 설정 (타입별로 다른 색상 적용)
            // 구글맵 기본 마커 중 초록색 계열 사용
            let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // 경유지 기본
            
            if (wp.type === 'origin') {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            } else if (wp.type === 'destination') {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            }

            return (
              <Marker
                key={`waypoint-marker-${index}`}
                position={wp.location}
                title={wp.name}
                icon={{
                  url: iconUrl,
                }}
                onClick={() => onWaypointClick?.(wp)}
              />
            );
          })}
        </>
      )}
    </GoogleMap>
  );
}
