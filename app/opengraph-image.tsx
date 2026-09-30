import { ImageResponse } from 'next/og';

export const alt = 'ScrapeMaster — real-time Amazon price tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#ffffff',
          color: '#111114',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex' }} />
          ScrapeMaster
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
          <span>Track Amazon prices.</span>
          <span style={{ color: '#4f46e5', marginTop: 12 }}>Buy at the right time.</span>
        </div>
        <div style={{ fontSize: 28, color: '#6b7280' }}>Price history, live updates and drop alerts for Amazon.</div>
      </div>
    ),
    size,
  );
}
