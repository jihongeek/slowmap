import { RouteData } from '../types/route';

export const mockRouteData: RouteData = {
  routeId: 'route-slow-001',
  summary: {
    totalDistance: 21500, // 21.5km (일부러 돌아가는 길)
    totalTime: 14400, // 4시간 (천천히 걷고 구경하는 시간 포함)
  },
  waypoints: [
    {
      id: 'wp-1',
      name: '서울역',
      location: { lat: 37.554648, lng: 126.972559 },
      type: 'origin',
      description: '복잡한 도심을 벗어나 여유로운 여정을 시작합니다.',
    },
    {
      id: 'wp-2',
      name: '남산 둘레길',
      location: { lat: 37.551169, lng: 126.988227 },
      type: 'stopover',
      description: '나무가 우거진 흙길. 길고양이들이 자주 출몰하는 평화로운 산책로입니다.',
      scores: {
        cats: 5,
        scenery: { sunset: false, mountain: true, flower: true, river: false, sea: false, stream: false },
        totalScore: 85,
      }
    },
    {
      id: 'wp-3',
      name: '해방촌 노을 언덕',
      location: { lat: 37.542314, lng: 126.985921 },
      type: 'stopover',
      description: '서울 시내가 한눈에 내려다보이는 언덕. 해질녘 노을이 아름답고 동네 고양이들이 식빵을 굽는 곳입니다.',
      scores: {
        cats: 8,
        scenery: { sunset: true, mountain: false, flower: false, river: false, sea: false, stream: false },
        totalScore: 95,
      }
    },
    {
      id: 'wp-4',
      name: '반포 한강공원',
      location: { lat: 37.510350, lng: 126.996021 },
      type: 'stopover',
      description: '탁 트인 강바람을 맞으며 물멍하기 좋은 곳. 봄에는 유채꽃이 만발합니다.',
      scores: {
        cats: 2,
        scenery: { sunset: true, mountain: false, flower: true, river: true, sea: false, stream: false },
        totalScore: 90,
      }
    },
    {
      id: 'wp-5',
      name: '양재천 벚꽃길',
      location: { lat: 37.476411, lng: 127.038101 },
      type: 'stopover',
      description: '잔잔하게 흐르는 하천을 따라 걷는 길. 물소리를 들으며 힐링할 수 있습니다.',
      scores: {
        cats: 3,
        scenery: { sunset: false, mountain: false, flower: true, river: false, sea: false, stream: true },
        totalScore: 88,
      }
    },
    {
      id: 'wp-6',
      name: '강남역',
      location: { lat: 37.497942, lng: 127.027621 },
      type: 'destination',
      description: '긴 여유의 끝, 다시 일상으로 돌아오는 도착지입니다.',
    },
  ],
  path: [
    { lat: 37.554648, lng: 126.972559 }, // 서울역
    { lat: 37.554000, lng: 126.975000 },
    { lat: 37.553000, lng: 126.980000 },
    { lat: 37.551169, lng: 126.988227 }, // 남산 둘레길
    { lat: 37.548000, lng: 126.987000 },
    { lat: 37.542314, lng: 126.985921 }, // 해방촌
    { lat: 37.530000, lng: 126.990000 },
    { lat: 37.510350, lng: 126.996021 }, // 반포 한강공원
    { lat: 37.490000, lng: 127.010000 },
    { lat: 37.476411, lng: 127.038101 }, // 양재천
    { lat: 37.485000, lng: 127.035000 },
    { lat: 37.497942, lng: 127.027621 }, // 강남역
  ],
};
