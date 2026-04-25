import { NextResponse } from 'next/server';
import { Coordinate, RouteData, Waypoint } from '@/types/route';

// Function to decode Google Maps polyline
function decodePolyline(encoded: string): Coordinate[] {
  const poly: Coordinate[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
}

// Function to calculate distance between two coordinates in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const PLACE_TYPES = ['park', 'tourist_attraction', 'cafe'] as const;

/**
 * Returns a random nearby place from top results, or null.
 */
async function findNearbyPlace(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number
): Promise<any | null> {
  for (const type of PLACE_TYPES) {
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&language=ko&key=${apiKey}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    if (placesData.status === 'OK' && placesData.results.length > 0) {
      const candidates = placesData.results.slice(0, Math.min(8, placesData.results.length));
      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex];
    }
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const originLat = searchParams.get('originLat');
    const originLng = searchParams.get('originLng');
    const destLat = searchParams.get('destLat');
    const destLng = searchParams.get('destLng');

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json({ error: 'Origin and destination coordinates are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
    }

    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    // 1. Fetch directions from Google Maps API (Direct route without waypoints first)
    // We use transit mode because walking is blocked in KR, and driving might take weird detours.
    // Transit gives a more realistic path for people.
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=transit&key=${apiKey}`;
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ 
        success: false, 
        error: 'ZERO_RESULTS',
        message: '해당 구간의 경로를 찾을 수 없습니다. 다른 출발지/도착지를 선택해주세요.' 
      }, { status: 200 }); // 200 OK로 보내서 프론트엔드에서 처리하도록 함
    }

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      throw new Error(`Failed to fetch directions: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    
    // 3. Decode polyline to get full path
    const path = decodePolyline(route.overview_polyline.points);

    // 4. Extract waypoints evenly spaced along the route
    const numWaypoints = 2; // 2개의 경유지
    const waypoints: Waypoint[] = [];
    
    // Add origin
    waypoints.push({
      id: 'origin',
      name: leg.start_address || '출발지',
      location: { lat: oLat, lng: oLng },
      type: 'origin'
    });

    // 출발지·도착지 주변 장소 (경로 중간뿐 아니라 양 끝 근처도 경유 후보에 포함)
    const [placeNearStart, placeNearEnd] = await Promise.all([
      findNearbyPlace(apiKey, oLat, oLng, 5000),
      findNearbyPlace(apiKey, dLat, dLng, 5000),
    ]);

    // Extract intermediate points from the path (경로상 구간)
    const intermediatePoints: Coordinate[] = [];
    if (path.length > numWaypoints + 1) {
      const step = Math.floor(path.length / (numWaypoints + 1));
      for (let i = 1; i <= numWaypoints; i++) {
        intermediatePoints.push(path[i * step]);
      }
    }

    const fromPath: any[] = [];
    for (let i = 0; i < intermediatePoints.length; i++) {
      const point = intermediatePoints[i];
      const found =
        (await findNearbyPlace(apiKey, point.lat, point.lng, 1500)) ||
        ({
          geometry: { location: { lat: point.lat, lng: point.lng } },
          name: `경로상 경유지 ${i + 1}`,
          vicinity: '',
        } as any);
      fromPath.push(found);
    }

    const seenIds = new Set<string>();
    const segments: { place: any; area: 'start' | 'path' | 'end' }[] = [];

    const addPlace = (p: any | null, area: 'start' | 'path' | 'end') => {
      if (!p) return;
      if (p.place_id) {
        if (seenIds.has(p.place_id)) return;
        seenIds.add(p.place_id);
      }
      segments.push({ place: p, area });
    };

    addPlace(placeNearStart, 'start');
    for (const p of fromPath) addPlace(p, 'path');
    addPlace(placeNearEnd, 'end');

    const selectedPlaces = segments.map((s) => s.place);

    // 6. Connect the points sequentially to actually visit the waypoints
    const routePoints = [
      { lat: oLat, lng: oLng },
      ...selectedPlaces.map(p => ({ lat: p.geometry.location.lat, lng: p.geometry.location.lng })),
      { lat: dLat, lng: dLng }
    ];

    let finalPath: Coordinate[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i+1];
      
      // Try to get transit route for this segment
      const legUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=transit&key=${apiKey}`;
      const legRes = await fetch(legUrl);
      const legData = await legRes.json();

      if (legData.status === 'OK' && legData.routes.length > 0) {
        const leg = legData.routes[0].legs[0];
        totalDistance += leg.distance.value;
        totalTime += leg.duration.value;
        finalPath.push(...decodePolyline(legData.routes[0].overview_polyline.points));
      } else {
        // Fallback: If no transit route (e.g., too short distance), draw a straight line
        const dist = getDistanceFromLatLonInM(start.lat, start.lng, end.lat, end.lng);
        totalDistance += dist;
        totalTime += Math.floor(dist / 1.2); // approx 1.2 m/s walking speed
        
        // Add straight line to path
        finalPath.push({ lat: start.lat, lng: start.lng });
        finalPath.push({ lat: end.lat, lng: end.lng });
      }

      // Add the waypoint to our list (except the last destination, which is added after loop)
      if (i < segments.length) {
        const { place, area } = segments[i];
        const areaLabel =
          area === 'start' ? '출발지 주변' : area === 'end' ? '도착지 주변' : '경로상';
        const vic = (place.vicinity || '').trim();
        const description = [vic, areaLabel].filter(Boolean).join(' · ');
        waypoints.push({
          id: place.place_id || `waypoint-${i}`,
          name: place.name || `경유지 ${i + 1}`,
          location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
          type: 'stopover',
          description: description || areaLabel
        });
      }
    }

    // Add destination
    waypoints.push({
      id: 'destination',
      name: leg.end_address || '도착지',
      location: { lat: dLat, lng: dLng },
      type: 'destination'
    });

    const routeData: RouteData = {
      routeId: Math.random().toString(36).substring(7),
      summary: {
        totalDistance: totalDistance,
        totalTime: totalTime,
      },
      waypoints,
      path: finalPath,
    };

    return NextResponse.json({
      success: true,
      data: routeData
    });
  } catch (error: any) {
    console.error('Route API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate route', details: error.message },
      { status: 500 }
    );
  }
}
