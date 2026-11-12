import React, { useMemo } from 'react';

interface EdisonGearBackdropProps {
  driveAngle: number;
}

function createGearPath(
  cx: number,
  cy: number,
  teeth: number,
  outerR: number,
  rootR: number,
  holeR: number
): string {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.66;
    const a4 = a0 + step * 0.82;

    const p0x = cx + rootR * Math.cos(a0);
    const p0y = cy + rootR * Math.sin(a0);
    const p1x = cx + rootR * Math.cos(a1);
    const p1y = cy + rootR * Math.sin(a1);
    const p2x = cx + outerR * Math.cos(a2);
    const p2y = cy + outerR * Math.sin(a2);
    const p3x = cx + outerR * Math.cos(a3);
    const p3y = cy + outerR * Math.sin(a3);
    const p4x = cx + rootR * Math.cos(a4);
    const p4y = cy + rootR * Math.sin(a4);

    if (i === 0) {
      pts.push(`M ${p0x.toFixed(2)} ${p0y.toFixed(2)}`);
    } else {
      pts.push(`L ${p0x.toFixed(2)} ${p0y.toFixed(2)}`);
    }
    pts.push(`L ${p1x.toFixed(2)} ${p1y.toFixed(2)}`);
    pts.push(`L ${p2x.toFixed(2)} ${p2y.toFixed(2)}`);
    pts.push(`L ${p3x.toFixed(2)} ${p3y.toFixed(2)}`);
    pts.push(`L ${p4x.toFixed(2)} ${p4y.toFixed(2)}`);
  }
  pts.push('Z');

  // Inner cutout ring (drawn counter-clockwise via arc for evenodd hole)
  if (holeR > 0) {
    pts.push(
      `M ${(cx + holeR).toFixed(2)} ${cy.toFixed(2)} ` +
        `A ${holeR} ${holeR} 0 1 0 ${(cx - holeR).toFixed(2)} ${cy.toFixed(2)} ` +
        `A ${holeR} ${holeR} 0 1 0 ${(cx + holeR).toFixed(2)} ${cy.toFixed(2)} Z`
    );
  }
  return pts.join(' ');
}

export const EdisonGearBackdrop: React.FC<EdisonGearBackdropProps> = ({ driveAngle }) => {
  const gears = useMemo(() => {
    return {
      // Main 24-tooth brass sun gear centered behind Level 2
      sun: createGearPath(600, 290, 24, 148, 128, 86),
      // Coupled 16-tooth steel planetary gear (left, near Level 1)
      leftIdler: createGearPath(250, 210, 16, 102, 84, 52),
      // Coupled 18-tooth bronze gear (right, near Level 3)
      rightIdler: createGearPath(935, 220, 18, 114, 96, 62),
      // Lower 12-tooth escapement pinion (below Level 2 multiplier)
      pinion: createGearPath(600, 488, 12, 74, 58, 28),
    };
  }, []);

  const sunRot = driveAngle;
  const leftRot = -driveAngle * (24 / 16) + 11.25;
  const rightRot = -driveAngle * (24 / 18) + 10;
  const pinionRot = -driveAngle * (24 / 12) + 15;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.24]"
    >
      <svg
        viewBox="0 0 1200 620"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="brassMetal" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#E6C27A" />
            <stop offset="55%" stopColor="#9A7638" />
            <stop offset="100%" stopColor="#463315" />
          </radialGradient>
          <radialGradient id="steelMetal" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="55%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </radialGradient>
        </defs>

        {/* Subtle horological bridge plates & calibration rings */}
        <circle
          cx="600"
          cy="290"
          r="210"
          fill="none"
          stroke="rgba(197, 160, 89, 0.25)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <line
          x1="250"
          y1="210"
          x2="600"
          y2="290"
          stroke="rgba(148, 163, 184, 0.22)"
          strokeWidth="2"
        />
        <line
          x1="600"
          y1="290"
          x2="935"
          y2="220"
          stroke="rgba(197, 160, 89, 0.22)"
          strokeWidth="2"
        />

        {/* Left Steel Idler Gear */}
        <g
          className="gear-transition"
          style={{
            transform: `rotate(${leftRot}deg)`,
            transformOrigin: '250px 210px',
          }}
        >
          <path
            d={gears.leftIdler}
            fill="url(#steelMetal)"
            fillRule="evenodd"
            stroke="#CBD5E1"
            strokeOpacity="0.3"
            strokeWidth="1.2"
          />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1="250"
              y1="210"
              x2={250 + 54 * Math.cos((deg * Math.PI) / 180)}
              y2={210 + 54 * Math.sin((deg * Math.PI) / 180)}
              stroke="#64748B"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
          <circle cx="250" cy="210" r="14" fill="#1E293B" stroke="#C5A059" strokeWidth="2.5" />
        </g>

        {/* Right Bronze Idler Gear */}
        <g
          className="gear-transition"
          style={{
            transform: `rotate(${rightRot}deg)`,
            transformOrigin: '935px 220px',
          }}
        >
          <path
            d={gears.rightIdler}
            fill="url(#brassMetal)"
            fillRule="evenodd"
            stroke="#FDE68A"
            strokeOpacity="0.28"
            strokeWidth="1.2"
          />
          {[0, 72, 144, 216, 288].map((deg) => (
            <line
              key={deg}
              x1="935"
              y1="220"
              x2={935 + 64 * Math.cos((deg * Math.PI) / 180)}
              y2={220 + 64 * Math.sin((deg * Math.PI) / 180)}
              stroke="#8B692D"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ))}
          <circle cx="935" cy="220" r="15" fill="#171410" stroke="#E6C27A" strokeWidth="2.5" />
        </g>

        {/* Main Center Brass Sun Gear */}
        <g
          className="gear-transition"
          style={{
            transform: `rotate(${sunRot}deg)`,
            transformOrigin: '600px 290px',
          }}
        >
          <path
            d={gears.sun}
            fill="url(#brassMetal)"
            fillRule="evenodd"
            stroke="#FDE68A"
            strokeOpacity="0.32"
            strokeWidth="1.4"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="600"
              y1="290"
              x2={600 + 88 * Math.cos((deg * Math.PI) / 180)}
              y2={290 + 88 * Math.sin((deg * Math.PI) / 180)}
              stroke="#9A7638"
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}
          <circle cx="600" cy="290" r="24" fill="#14110D" stroke="#D4AF6A" strokeWidth="3" />
          <circle cx="600" cy="290" r="8" fill="#38BDF8" fillOpacity="0.5" />
        </g>

        {/* Lower Escapement Pinion */}
        <g
          className="gear-transition"
          style={{
            transform: `rotate(${pinionRot}deg)`,
            transformOrigin: '600px 488px',
          }}
        >
          <path
            d={gears.pinion}
            fill="url(#steelMetal)"
            fillRule="evenodd"
            stroke="#38BDF8"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="600"
              y1="488"
              x2={600 + 30 * Math.cos((deg * Math.PI) / 180)}
              y2={488 + 30 * Math.sin((deg * Math.PI) / 180)}
              stroke="#64748B"
              strokeWidth="4"
            />
          ))}
          <circle cx="600" cy="488" r="10" fill="#0F172A" stroke="#C5A059" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};
