'use client';

import { useState } from 'react';
import { RoutingForm } from '@/components/form/RoutingForm';
import { MapContainer } from '@/components/map/MapContainer';
import { RouteData, Waypoint } from '@/types/route';
import { ChevronDown, ChevronUp, Cat, Sunset, Mountain, Flower2, Waves, Droplets } from 'lucide-react';
import { WaypointList } from '@/components/map/WaypointList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaypointsOpen, setIsWaypointsOpen] = useState(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);

  const handleRouteSubmit = async (origin: string, destination: string) => {
    setIsLoading(true);
    setRouteData(null);
    setSelectedWaypoint(null); // Reset selection
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      // 1. Geocode origin and destination
      const geocode = async (address: string) => {
        // Check if address is already coordinates "lat, lng"
        const coordsMatch = address.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
        if (coordsMatch) {
          return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
        }
        
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await res.json();
        if (data.status === 'OK' && data.results.length > 0) {
          return data.results[0].geometry.location;
        }
        throw new Error(`주소를 찾을 수 없습니다: ${address}`);
      };

      const originCoords = await geocode(origin);
      const destCoords = await geocode(destination);

      // 2. Get route
      const routeRes = await fetch(`/api/route?originLat=${originCoords.lat}&originLng=${originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`);
      const routeJson = await routeRes.json();
      
      if (!routeJson.success) {
        if (routeJson.error === 'ZERO_RESULTS') {
          alert('해당 구간의 경로를 찾을 수 없습니다. 대중교통 경로가 없는 곳일 수 있습니다. 다른 출발지/도착지를 선택해주세요.');
          setIsLoading(false);
          return;
        }
        throw new Error(routeJson.error || '경로 탐색에 실패했습니다.');
      }

      const newRouteData: RouteData = routeJson.data;
      setRouteData(newRouteData);
      setIsLoading(false);
      setIsWaypointsOpen(true);

      // 3. Fetch scenery and TNR data for waypoints asynchronously
      const fetchWaypointData = async (wpIndex: number) => {
        const wp = newRouteData.waypoints[wpIndex];
        
        try {
          // Fetch scenery
          const sceneryRes = await fetch(`/api/scenery?lat=${wp.location.lat}&lng=${wp.location.lng}`);
          const sceneryJson = await sceneryRes.json();
          
          // Fetch TNR count
          const tnrRes = await fetch(`/api/tnr/count?lat=${wp.location.lat}&lng=${wp.location.lng}`);
          const tnrJson = await tnrRes.json();

          setRouteData(prev => {
            if (!prev) return prev;
            const updatedWaypoints = [...prev.waypoints];
            updatedWaypoints[wpIndex] = {
              ...prev.waypoints[wpIndex],
              scores: {
                cats: tnrJson.success ? tnrJson.data.count : 0,
                scenery: sceneryJson.success ? {
                  sunset: sceneryJson.data.sunset,
                  mountain: sceneryJson.data.mountain,
                  flower: sceneryJson.data.flower,
                  river: sceneryJson.data.river,
                  sea: sceneryJson.data.sea,
                  stream: sceneryJson.data.stream,
                } : {
                  sunset: false, mountain: false, flower: false, river: false, sea: false, stream: false
                },
                totalScore: sceneryJson.success ? sceneryJson.data.totalScore : 0
              }
            };
            return { ...prev, waypoints: updatedWaypoints };
          });
        } catch (error) {
          console.error(`Failed to fetch data for waypoint ${wpIndex}:`, error);
        }
      };

      // Start fetching for all waypoints (or just stopovers)
      newRouteData.waypoints.forEach((_, index) => {
        fetchWaypointData(index);
      });

    } catch (error: any) {
      console.error(error);
      alert(error.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 영역 */}
      <header className="bg-white border-b p-4 shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800">급할수록 돌아가라</h1>
      </header>

      {/* 메인 컨텐츠 영역 (모바일 화면에 최적화) */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* 좌측(또는 상단) 입력 폼 영역 */}
        <div className="w-full sm:w-[350px] md:w-[400px] p-0 sm:p-4 shrink-0 z-10 bg-white sm:bg-transparent flex flex-col h-auto sm:h-full overflow-hidden">
          <RoutingForm onSubmit={handleRouteSubmit} />
          
          {/* 로딩 표시 */}
          {isLoading && (
            <div className="mt-4 p-4 text-center text-sm text-emerald-600 animate-pulse font-medium">
              고양이와 예쁜 풍경이 있는 길을 찾는 중...
            </div>
          )}
          
          {/* 경로 요약 정보 표시 */}
          {routeData && !isLoading && (
            <div className="mt-4 bg-white sm:rounded-xl sm:border shadow-sm flex flex-col overflow-hidden">
              {/* 요약 헤더 (클릭 시 토글) */}
              <button 
                onClick={() => setIsWaypointsOpen(!isWaypointsOpen)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">경로 요약</h3>
                  <div className="flex gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">총 거리</span>
                      <span className="font-medium">{(routeData.summary.totalDistance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">예상 소요 시간</span>
                      <span className="font-medium">{Math.round(routeData.summary.totalTime / 60)} 분</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-emerald-600 text-xs font-semibold">총 여유 점수</span>
                      <span className="font-bold text-emerald-700">
                        {routeData.waypoints.reduce((acc, wp) => acc + (wp.scores?.totalScore || 0), 0)}점
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isWaypointsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* 경유지 목록 (토글 콘텐츠) */}
              {isWaypointsOpen && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 overflow-y-auto max-h-[400px]">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">경유 장소</h4>
                  <WaypointList waypoints={routeData.waypoints} onWaypointClick={setSelectedWaypoint} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측(또는 하단) 지도 영역 */}
        <div className="flex-1 h-full relative">
          <MapContainer routeData={routeData} selectedWaypoint={selectedWaypoint} onWaypointClick={setSelectedWaypoint} />
        </div>
      </div>

      {/* 장소 상세 정보 다이얼로그 */}
      <Dialog open={!!selectedWaypoint} onOpenChange={(open) => !open && setSelectedWaypoint(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">{selectedWaypoint?.name}</DialogTitle>
            {selectedWaypoint?.description && (
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {selectedWaypoint.description}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedWaypoint && (
            <div className="flex flex-col gap-4 mt-2">
              {/* 스트리트 뷰 이미지 */}
              <div className="relative w-full h-48 sm:h-64 bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${selectedWaypoint.location.lat},${selectedWaypoint.location.lng}&fov=90&heading=235&pitch=10&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                  alt={`${selectedWaypoint.name} 스트리트 뷰`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-sm text-gray-400 bg-gray-50">스트리트 뷰 이미지가 없습니다</div>';
                  }}
                />
              </div>
              
              {/* 여유 점수 및 뱃지 */}
              {selectedWaypoint.scores && (
                <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">여유 점수</span>
                    <span className="text-lg font-bold text-emerald-600">{selectedWaypoint.scores.totalScore}점</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedWaypoint.scores.cats > 0 && (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Cat className="w-3.5 h-3.5 mr-1" />
                        고양이 {selectedWaypoint.scores.cats}마리
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.sunset && (
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Sunset className="w-3.5 h-3.5 mr-1" />
                        노을
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.mountain && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Mountain className="w-3.5 h-3.5 mr-1" />
                        산
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.flower && (
                      <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-200">
                        <Flower2 className="w-3.5 h-3.5 mr-1" />
                        꽃
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.river && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Waves className="w-3.5 h-3.5 mr-1" />
                        강
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.sea && (
                      <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                        <Waves className="w-3.5 h-3.5 mr-1" />
                        바다
                      </Badge>
                    )}
                    {selectedWaypoint.scores.scenery.stream && (
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                        <Droplets className="w-3.5 h-3.5 mr-1" />
                        하천
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
