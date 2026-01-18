import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CardDex - Pokemon Card Collection Tracker';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
              fontSize: 60,
            }}
          >
            🃏
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            CardDex
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          The family-friendly way to track your Pokemon card collection
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 24px',
              color: 'white',
              fontSize: 20,
            }}
          >
            Track Collections
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 24px',
              color: 'white',
              fontSize: 20,
            }}
          >
            Earn Badges
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 24px',
              color: 'white',
              fontSize: 20,
            }}
          >
            Kid-Friendly
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
