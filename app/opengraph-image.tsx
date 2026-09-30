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
          background: '#f4f2ec',
          color: '#0e0e0c',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 32, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0e0e0c', display: 'flex' }} />
          ScrapeMaster
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 96, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
          <span>Prices move.</span>
          <span style={{ background: '#c6f432', padding: '0 12px', marginTop: 12, alignSelf: 'flex-start' }}>Know first.</span>
        </div>
        <div style={{ fontSize: 28, color: '#6e6c64' }}>Price history, live updates and drop alerts for Amazon.</div>
      </div>
    ),
    size,
  );
}
