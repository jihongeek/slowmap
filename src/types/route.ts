// 좌표 타입
export type Coordinate = {
  lat: number;
  lng: number;
};

// 장소(마커) 타입
export type Waypoint = {
  id: string;
  name: string;
  location: Coordinate;
  type: 'origin' | 'destination' | 'stopover'; // 출발지, 도착지, 경유지
  scores?: {
    cats: number; // 고양이 수 (마리)
    scenery: {
      sunset: boolean; // 노을
      mountain: boolean; // 산
      flower: boolean; // 꽃
      river: boolean; // 강
      sea: boolean; // 바다
      stream: boolean; // 하천
    };
    totalScore: number; // 여유로움 점수 (높을수록 좋음)
  };
  description?: string; // 장소 설명
};

// 전체 경로 데이터 타입
export type RouteData = {
  routeId: string;
  summary: {
    totalDistance: number; // 총 거리 (미터)
    totalTime: number; // 총 소요 시간 (초)
  };
  waypoints: Waypoint[]; // 마커로 표시할 지점들
  path: Coordinate[]; // 선(Polyline)으로 그릴 상세 경로 좌표 배열
};
