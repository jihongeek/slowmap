import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tnr.db');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
    }

    // 1. Reverse Geocoding to get sido and sigungu
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ko&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`Failed to reverse geocode: ${geocodeData.status}`);
    }

    let sido = '';
    let sigungu = '';

    // Extract address components
    const addressComponents = geocodeData.results[0].address_components;
    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        sido = component.long_name;
      }
      if (component.types.includes('locality') || component.types.includes('sublocality_level_1')) {
        // Only set sigungu if it's not already set, or prefer sublocality_level_1 over locality if both exist
        // Usually, in Korea, locality is city (e.g., 수원시), sublocality_level_1 is district (e.g., 영통구)
        // For Seoul, locality is Seoul, sublocality_level_1 is district (e.g., 강남구)
        if (component.types.includes('sublocality_level_1')) {
          sigungu = component.long_name;
        } else if (!sigungu && component.types.includes('locality')) {
          sigungu = component.long_name;
        }
      }
    }

    // If sido is like "서울", change to "서울특별시" to match DB
    const sidoMap: Record<string, string> = {
      '서울': '서울특별시',
      '부산': '부산광역시',
      '대구': '대구광역시',
      '인천': '인천광역시',
      '광주': '광주광역시',
      '대전': '대전광역시',
      '울산': '울산광역시',
      '세종특별자치시': '세종특별자치시',
      '경기': '경기도',
      '강원특별자치도': '강원특별자치도',
      '충북': '충청북도',
      '충남': '충청남도',
      '전북특별자치도': '전북특별자치도',
      '전남': '전라남도',
      '경북': '경상북도',
      '경남': '경상남도',
      '제주특별자치도': '제주특별자치도'
    };

    if (sidoMap[sido]) {
      sido = sidoMap[sido];
    }

    // 2. Query DB for cat count
    const db = new Database(dbPath, { readonly: true });
    
    let countQuery = 'SELECT COUNT(*) as total FROM tnr_data WHERE 1=1';
    const params: any[] = [];

    if (sido) {
      countQuery += ' AND sido = ?';
      params.push(sido);
    }

    if (sigungu) {
      countQuery += ' AND sigungu = ?';
      params.push(sigungu);
    }

    const totalResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalResult.total;

    db.close();

    return NextResponse.json({
      success: true,
      data: {
        sido,
        sigungu,
        count: total
      }
    });

  } catch (error: any) {
    console.error('TNR Count API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get TNR count', details: error.message },
      { status: 500 }
    );
  }
}
