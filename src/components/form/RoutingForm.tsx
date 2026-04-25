'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search, Cat, Sunset, Flower2, LocateFixed, Loader2 } from 'lucide-react';

interface RoutingFormProps {
  onSubmit: (origin: string, destination: string) => void;
}

export function RoutingForm({ onSubmit }: RoutingFormProps) {
  const [origin, setOrigin] = useState('현재위치');
  const [destination, setDestination] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination) {
      onSubmit(origin, destination);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('현재 브라우저에서는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          
          if (apiKey) {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=ko`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              // 대한민국, 서울특별시 등의 불필요한 앞부분을 제거하고 간략한 주소 사용
              let address = data.results[0].formatted_address;
              address = address.replace('대한민국 ', '');
              setOrigin(address);
            } else {
              setOrigin('현재 위치를 찾을 수 없습니다');
            }
          } else {
            setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error('주소 변환 실패:', error);
          setOrigin('주소 변환에 실패했습니다');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error);
        alert('위치 정보를 가져오는데 실패했습니다. 권한을 확인해주세요.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <Card className="w-full shadow-md border-0 rounded-none sm:rounded-xl sm:border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-500" />
          여유로운 길찾기
        </CardTitle>
        <CardDescription className="text-xs mt-1.5 flex items-center gap-1.5 text-gray-500">
          <Cat className="w-3.5 h-3.5" />
          <Sunset className="w-3.5 h-3.5" />
          <Flower2 className="w-3.5 h-3.5" />
          <span>고양이와 아름다운 풍경이 있는 길로 안내합니다.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex flex-col">
            <div className="relative">
              <div className="absolute left-3 top-3 text-emerald-600">
                <MapPin className="w-4 h-4" />
              </div>
              <Input
                placeholder="출발지를 입력하세요"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="pl-10 pr-10 focus-visible:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                title="현재 위치로 설정"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-3 text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <Input
              placeholder="도착지를 입력하세요"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500"
            />
          </div>
          
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Search className="w-4 h-4 mr-2" />
            여유로운 경로 찾기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
