// Code-drawn, paper-cut style illustrations. Flat shapes, ink outlines,
// a limited palette from theme.ts. Every piece takes a `width` and scales
// from its own viewBox, so scenes can place them freely.
import React from "react";
import { C, FONT } from "../lib/theme";

type Base = { width: number; style?: React.CSSProperties };
const ink = { stroke: C.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** A glass vaccine vial with flip-off cap, crimp, liquid and label (with optional VVM). */
export const Vial: React.FC<Base & { capColor?: string; liquid?: string; label?: string; vvm?: number; showVVM?: boolean }> = ({
  width,
  style,
  capColor = C.cold,
  liquid = "#EAF2F7",
  label = "VACCINE",
  vvm = 0,
  showVVM = false,
}) => {
  // vvm: 0 = square much lighter than circle, 1 = darker than circle
  const sq = Math.round(235 - vvm * 215);
  return (
    <svg width={width} viewBox="0 0 200 400" style={{ overflow: "visible", ...style }}>
      <rect x="44" y="8" width="112" height="46" rx="10" fill={capColor} {...ink} />
      <rect x="58" y="16" width="30" height="10" rx="5" fill="#fff" opacity="0.35" />
      <rect x="54" y="52" width="92" height="34" rx="4" fill="#BFC5CC" {...ink} />
      <line x1="62" y1="62" x2="62" y2="78" stroke="#fff" strokeWidth="5" opacity="0.6" />
      <path d="M70 86 L70 112 C70 124 30 132 30 160 L30 360 C30 378 44 390 62 390 L138 390 C156 390 170 378 170 360 L170 160 C170 132 130 124 130 112 L130 86 Z" fill="#E2EDF4" {...ink} />
      <path d="M33 220 L167 220 L167 360 C167 376 154 387 138 387 L62 387 C46 387 33 376 33 360 Z" fill={liquid} />
      <line x1="33" y1="220" x2="167" y2="220" stroke={C.coldDeep} strokeWidth="3" opacity="0.4" />
      <rect x="28" y="236" width="144" height="104" fill={C.card} {...ink} strokeWidth={4} />
      <text x="40" y="270" fontFamily={FONT.sans} fontWeight={900} fontSize={showVVM ? 19 : 24} fill={C.ink}>
        {label}
      </text>
      <rect x="40" y="284" width="70" height="7" fill={C.rule} />
      <rect x="40" y="300" width="54" height="7" fill={C.rule} />
      <rect x="40" y="316" width="62" height="7" fill={C.rule} />
      {showVVM ? (
        <g>
          <circle cx="140" cy="310" r="20" fill="#6E5B8C" stroke={C.ink} strokeWidth="3" />
          <rect x="129" y="299" width="22" height="22" fill={`rgb(${sq},${sq},${Math.min(255, sq + 10)})`} />
        </g>
      ) : null}
      <rect x="44" y="150" width="14" height="200" rx="7" fill="#fff" opacity="0.55" />
    </svg>
  );
};

/** Thermometer. `level` and `band` are 0..1 along the tube. */
export const Thermometer: React.FC<Base & { level: number; band?: [number, number]; color?: string; ticks?: number }> = ({
  width,
  style,
  level,
  band,
  color = C.cold,
  ticks = 10,
}) => {
  const top = 30;
  const bottom = 410;
  const y = (v: number) => bottom - v * (bottom - top);
  return (
    <svg width={width} viewBox="0 0 200 520" style={{ overflow: "visible", ...style }}>
      <rect x="62" y="10" width="76" height="430" rx="38" fill={C.card} {...ink} />
      {band ? <rect x="70" y={y(band[1])} width="60" height={y(band[0]) - y(band[1])} fill={C.iceLight} /> : null}
      <rect x="84" y={y(level)} width="32" height={bottom - y(level) + 40} fill={color} />
      <circle cx="100" cy="456" r="56" fill={color} {...ink} />
      <circle cx="84" cy="440" r="14" fill="#fff" opacity="0.4" />
      <rect x="84" y="30" width="32" height="420" fill="none" />
      {Array.from({ length: ticks + 1 }).map((_, i) => (
        <line key={i} x1="138" x2={i % 2 === 0 ? 168 : 156} y1={y(i / ticks)} y2={y(i / ticks)} stroke={C.ink} strokeWidth="4" />
      ))}
      <rect x="62" y="10" width="76" height="430" rx="38" fill="none" {...ink} />
    </svg>
  );
};

/** Purpose-built vaccine fridge with a glass door, shelves of cartons and a display. */
export const Fridge: React.FC<Base & { display?: string; doorOpen?: number; glow?: number }> = ({ width, style, display = "5.0°C", doorOpen = 0, glow = 0 }) => {
  const boxColors = [C.cold, C.card, C.ice, C.amber, C.card, C.cold, C.iceLight, C.card];
  return (
    <svg width={width} viewBox="0 0 440 760" style={{ overflow: "visible", ...style }}>
      <rect x="10" y="10" width="420" height="740" rx="22" fill="#F4F1EA" {...ink} />
      <rect x="30" y="30" width="380" height="70" rx="8" fill={C.ink} />
      <rect x="250" y="42" width="140" height="46" rx="6" fill="#0E2A1C" />
      <text x="320" y="76" textAnchor="middle" fontFamily={FONT.mono} fontWeight={600} fontSize="30" fill="#7CF0A6">
        {display}
      </text>
      <circle cx="58" cy="65" r="10" fill="#7CF0A6" />
      <text x="80" y="74" fontFamily={FONT.mono} fontWeight={600} fontSize="24" fill={C.card}>
        VACCINES
      </text>
      <rect x="30" y="118" width="380" height="600" rx="10" fill={`rgba(215,234,246,${0.5 + glow * 0.3})`} {...ink} />
      {[0, 1, 2, 3].map((s) => (
        <g key={s}>
          <line x1="40" x2="400" y1={250 + s * 140} y2={250 + s * 140} stroke={C.ink} strokeWidth="5" />
          {[0, 1, 2, 3].map((b) => {
            const c = boxColors[(s * 3 + b) % boxColors.length];
            const h = 70 + ((s + b) % 3) * 14;
            return <rect key={b} x={58 + b * 86} y={250 + s * 140 - h} width="70" height={h} fill={c} stroke={C.ink} strokeWidth="4" />;
          })}
        </g>
      ))}
      {/* glass door, hinged on the left: squashes as it opens */}
      <g transform={`translate(30 0) scale(${1 - doorOpen * 0.82} 1) translate(-30 0)`}>
        <rect x="30" y="118" width="380" height="600" rx="10" fill="rgba(255,255,255,0.18)" stroke={C.ink} strokeWidth="8" />
        <path d="M70 140 L150 140 L60 420 Z" fill="#fff" opacity="0.28" />
        <rect x="380" y="330" width="14" height="170" rx="7" fill={C.ink} />
      </g>
      <rect x="40" y="730" width="40" height="18" fill={C.ink} />
      <rect x="360" y="730" width="40" height="18" fill={C.ink} />
    </svg>
  );
};

/** Refrigerated box truck. `wheel` is the wheel rotation in degrees. */
export const Truck: React.FC<Base & { wheel?: number; label?: string }> = ({ width, style, wheel = 0, label = "COLD CHAIN" }) => {
  const Wheel = ({ cx }: { cx: number }) => (
    <g transform={`translate(${cx} 350)`}>
      <circle r="52" fill={C.ink} />
      <circle r="26" fill="#BFC5CC" />
      <g transform={`rotate(${wheel})`}>
        {[0, 60, 120].map((a) => (
          <rect key={a} x="-3" y="-24" width="6" height="48" fill={C.ink} transform={`rotate(${a})`} />
        ))}
      </g>
    </g>
  );
  return (
    <svg width={width} viewBox="0 0 900 420" style={{ overflow: "visible", ...style }}>
      <ellipse cx="450" cy="400" rx="430" ry="16" fill="rgba(55,45,31,0.18)" />
      <rect x="20" y="40" width="600" height="270" rx="10" fill={C.card} {...ink} />
      <rect x="20" y="230" width="600" height="34" fill={C.cold} />
      <rect x="560" y="10" width="60" height="70" rx="6" fill="#BFC5CC" {...ink} />
      {[22, 36, 50, 64].map((y) => (
        <line key={y} x1="570" x2="610" y1={y + 4} y2={y + 4} stroke={C.ink} strokeWidth="3" />
      ))}
      <g transform="translate(110 140)">
        <Snowflake width={110} color={C.cold} raw />
      </g>
      <text x="200" y="168" fontFamily={FONT.sans} fontWeight={900} fontSize="52" letterSpacing="-1" fill={C.ink}>
        {label}
      </text>
      <text x="202" y="208" fontFamily={FONT.mono} fontWeight={600} fontSize="26" fill={C.inkSoft}>
        TEMPERATURE CONTROLLED
      </text>
      <path d="M630 110 L770 110 C800 110 820 130 834 160 L862 230 L870 310 L630 310 Z" fill={C.cold} {...ink} />
      <path d="M660 132 L760 132 C780 132 792 144 800 162 L816 210 L660 210 Z" fill={C.iceLight} {...ink} strokeWidth={4} />
      <rect x="846" y="270" width="34" height="30" rx="4" fill={C.amber} {...ink} strokeWidth={4} />
      <rect x="10" y="300" width="880" height="22" rx="6" fill={C.ink} />
      <Wheel cx={150} />
      <Wheel cx={480} />
      <Wheel cx={760} />
    </svg>
  );
};

/** Insulated shipping box with cold packs and cartons. */
export const ColdBox: React.FC<Base & { lid?: number; label?: string }> = ({ width, style, lid = 0, label = "KEEP 2–8 °C" }) => (
  <svg width={width} viewBox="0 0 520 440" style={{ overflow: "visible", ...style }}>
    <ellipse cx="260" cy="428" rx="240" ry="12" fill="rgba(55,45,31,0.18)" />
    <rect x="40" y="120" width="440" height="300" rx="14" fill={C.card} {...ink} />
    <rect x="62" y="140" width="396" height="80" fill={C.iceLight} stroke={C.ink} strokeWidth="4" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={80 + i * 128} y="150" width="100" height="56" rx="10" fill={C.ice} stroke={C.ink} strokeWidth="4" />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={90 + i * 72} y="96" width="56" height="70" fill={i % 2 ? C.cold : C.card} stroke={C.ink} strokeWidth="4" />
    ))}
    <rect x="40" y="226" width="440" height="194" rx="14" fill={C.cold} {...ink} />
    <rect x="120" y="282" width="280" height="76" rx="6" fill={C.card} {...ink} strokeWidth={4} />
    <text x="260" y="333" textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize="38" fill={C.ink}>
      {label}
    </text>
    <g transform={`rotate(${-lid * 28} 40 120)`}>
      <rect x="30" y="80" width="460" height="46" rx="12" fill={C.coldDeep} {...ink} />
    </g>
  </svg>
);

/** Digital data logger with an LCD and a buffered probe cable. */
export const Logger: React.FC<Base & { reading?: string; alarm?: boolean }> = ({ width, style, reading = "5.1°C", alarm = false }) => (
  <svg width={width} viewBox="0 0 420 300" style={{ overflow: "visible", ...style }}>
    <rect x="10" y="10" width="400" height="280" rx="34" fill={C.ink} />
    <rect x="22" y="22" width="376" height="256" rx="26" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="4" />
    <rect x="44" y="44" width="332" height="150" rx="12" fill={alarm ? "#F6D1C8" : "#D8F0DF"} />
    <text x="210" y="138" textAnchor="middle" fontFamily={FONT.mono} fontWeight={600} fontSize="72" fill={alarm ? C.warm : "#123A24"}>
      {reading}
    </text>
    <text x="62" y="78" fontFamily={FONT.mono} fontWeight={600} fontSize="22" fill={alarm ? C.warm : "#123A24"}>
      {alarm ? "ALARM" : "REC ●"}
    </text>
    <text x="358" y="78" textAnchor="end" fontFamily={FONT.mono} fontWeight={600} fontSize="22" fill="#123A24">
      MIN/MAX
    </text>
    <circle cx="110" cy="238" r="22" fill="#3A3A3A" />
    <circle cx="180" cy="238" r="22" fill="#3A3A3A" />
    <rect x="250" y="222" width="110" height="32" rx="16" fill={alarm ? C.warm : C.ok} />
  </svg>
);

/** Simple building icons for route maps. */
export const Factory: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 200 170" style={{ overflow: "visible", ...style }}>
    <rect x="120" y="10" width="26" height="70" fill={C.inkSoft} {...ink} />
    <path d="M10 160 L10 70 L60 100 L60 70 L110 100 L110 70 L160 100 L190 100 L190 160 Z" fill={C.card} {...ink} />
    {[30, 80, 130].map((x) => (
      <rect key={x} x={x} y="120" width="26" height="22" fill={C.ice} stroke={C.ink} strokeWidth="4" />
    ))}
  </svg>
);

export const Warehouse: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 200 170" style={{ overflow: "visible", ...style }}>
    <path d="M10 160 L10 70 L100 20 L190 70 L190 160 Z" fill={C.card} {...ink} />
    <rect x="40" y="90" width="52" height="70" fill={C.iceLight} {...ink} strokeWidth={4} />
    <rect x="108" y="90" width="52" height="70" fill={C.iceLight} {...ink} strokeWidth={4} />
    {[102, 114, 126, 138, 150].map((y) => (
      <g key={y}>
        <line x1="44" x2="88" y1={y} y2={y} stroke={C.ink} strokeWidth="3" />
        <line x1="112" x2="156" y1={y} y2={y} stroke={C.ink} strokeWidth="3" />
      </g>
    ))}
    <g transform="translate(86 38) scale(0.26)">
      <Snowflake width={110} color={C.cold} raw />
    </g>
  </svg>
);

export const Clinic: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 200 170" style={{ overflow: "visible", ...style }}>
    <rect x="20" y="50" width="160" height="110" fill={C.card} {...ink} />
    <rect x="10" y="36" width="180" height="22" fill={C.cold} {...ink} />
    <rect x="80" y="104" width="40" height="56" fill={C.iceLight} {...ink} strokeWidth={4} />
    <rect x="36" y="80" width="30" height="30" fill={C.iceLight} stroke={C.ink} strokeWidth="4" />
    <rect x="134" y="80" width="30" height="30" fill={C.iceLight} stroke={C.ink} strokeWidth="4" />
    <circle cx="100" cy="20" r="22" fill={C.ok} {...ink} strokeWidth={4} />
    <path d="M100 8 L100 32 M88 20 L112 20" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

export const Pharmacy: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 400 300" style={{ overflow: "visible", ...style }}>
    <rect x="20" y="70" width="360" height="220" fill={C.card} {...ink} />
    <path d="M10 70 L390 70 L370 120 L30 120 Z" fill={C.ok} {...ink} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path key={i} d={`M${30 + i * 60} 120 a30 22 0 0 0 60 0`} fill={i % 2 ? C.ok : C.card} stroke={C.ink} strokeWidth="4" />
    ))}
    <rect x="40" y="20" width="320" height="46" fill={C.ink} />
    <text x="200" y="55" textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize="34" letterSpacing="4" fill={C.card}>
      PHARMACY
    </text>
    <rect x="50" y="160" width="150" height="110" fill={C.iceLight} {...ink} strokeWidth={4} />
    <rect x="230" y="160" width="120" height="130" fill={C.ice} {...ink} strokeWidth={4} />
  </svg>
);

/** Icons. `raw` renders a bare <g> for nesting inside another SVG. */
export const Snowflake: React.FC<Base & { color?: string; raw?: boolean }> = ({ width, style, color = C.cold, raw }) => {
  const arms = [0, 60, 120, 180, 240, 300].map((a) => (
    <g key={a} transform={`rotate(${a})`}>
      <line x1="0" y1="0" x2="0" y2="-46" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <path d="M-14 -34 L0 -22 L14 -34" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ));
  const g = <g transform={raw ? `scale(${width / 110})` : "translate(55 55)"}>{arms}</g>;
  if (raw) return g;
  return (
    <svg width={width} viewBox="0 0 110 110" style={{ overflow: "visible", ...style }}>
      {g}
    </svg>
  );
};

export const Sun: React.FC<Base & { color?: string; spin?: number }> = ({ width, style, color = C.amber, spin = 0 }) => (
  <svg width={width} viewBox="0 0 200 200" style={{ overflow: "visible", ...style }}>
    <g transform={`translate(100 100) rotate(${spin})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x="-7" y="-96" width="14" height="30" rx="7" fill={color} stroke={C.ink} strokeWidth="4" transform={`rotate(${i * 30})`} />
      ))}
      <circle r="56" fill={color} {...ink} />
    </g>
  </svg>
);

export const Clock: React.FC<Base & { t: number }> = ({ width, style, t }) => (
  <svg width={width} viewBox="0 0 200 200" style={{ overflow: "visible", ...style }}>
    <circle cx="100" cy="100" r="88" fill={C.card} {...ink} />
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={i} x1="100" y1="22" x2="100" y2={i % 3 === 0 ? 40 : 32} stroke={C.ink} strokeWidth="5" transform={`rotate(${i * 30} 100 100)`} />
    ))}
    <line x1="100" y1="100" x2="100" y2="56" stroke={C.ink} strokeWidth="9" strokeLinecap="round" transform={`rotate(${t * 30} 100 100)`} />
    <line x1="100" y1="100" x2="100" y2="34" stroke={C.warm} strokeWidth="6" strokeLinecap="round" transform={`rotate(${t * 360} 100 100)`} />
    <circle cx="100" cy="100" r="9" fill={C.ink} />
  </svg>
);

/** Outstretched arm (rolled sleeve, elbow, forearm, fist) with a round bandage — the end of the chain. */
export const Arm: React.FC<Base & { bandage?: number }> = ({ width, style, bandage = 1 }) => {
  const skin = "#C98B63";
  const skinShade = "#B0744F";
  return (
    <svg width={width} viewBox="0 0 760 300" style={{ overflow: "visible", ...style }}>
      {/* sleeve */}
      <path d="M0 60 L210 52 C236 51 252 70 252 100 L252 200 C252 230 236 249 210 248 L0 240 Z" fill={C.cold} {...ink} />
      <path d="M200 54 C226 60 236 80 236 104 L236 196 C236 222 226 240 200 246" fill="none" stroke={C.coldDeep} strokeWidth="14" />
      {/* upper arm → elbow → forearm */}
      <path
        d="M246 84 C320 70 400 76 450 92 C480 100 500 104 530 104 L640 110 C660 111 668 122 668 136 L668 170 C668 184 660 192 640 193 L530 196 C500 197 478 206 450 214 C400 228 320 232 246 218 Z"
        fill={skin}
        {...ink}
      />
      <path d="M452 104 C470 128 470 182 452 204" fill="none" stroke={skinShade} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      {/* fist */}
      <path d="M640 104 C690 92 740 104 748 138 C756 172 730 204 690 204 C664 204 646 196 640 190 Z" fill={skin} {...ink} />
      <path d="M676 120 C700 116 722 122 730 136" fill="none" stroke={skinShade} strokeWidth="6" strokeLinecap="round" />
      <path d="M690 150 L726 150 M690 172 L722 174" stroke={skinShade} strokeWidth="5" strokeLinecap="round" />
      {/* bandage on the upper arm */}
      <g transform={`translate(340 140) scale(${bandage})`}>
        <circle r="34" fill="#E9C9A4" {...ink} strokeWidth={4} />
        <circle r="15" fill="#F4E3CC" />
      </g>
    </svg>
  );
};

export const Syringe: React.FC<Base> = ({ width, style }) => (
  <svg width={width} viewBox="0 0 520 120" style={{ overflow: "visible", ...style }}>
    <rect x="10" y="50" width="60" height="20" fill={C.inkSoft} {...ink} strokeWidth={4} />
    <rect x="70" y="20" width="18" height="80" rx="4" fill={C.ink} />
    <rect x="88" y="30" width="270" height="60" rx="8" fill="rgba(215,234,246,0.85)" {...ink} />
    <rect x="200" y="36" width="152" height="48" fill={C.iceLight} />
    {[120, 160, 200, 240, 280, 320].map((x) => (
      <line key={x} x1={x} x2={x} y1="30" y2="52" stroke={C.ink} strokeWidth="3" />
    ))}
    <rect x="358" y="48" width="40" height="24" fill={C.inkSoft} {...ink} strokeWidth={4} />
    <line x1="398" y1="60" x2="510" y2="60" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
  </svg>
);

/** Parallax scenery for transport shots. */
export const Skyline: React.FC<{ width: number; color: string; seed?: number; height?: number }> = ({ width, color, seed = 1, height = 300 }) => {
  const blocks: React.ReactNode[] = [];
  let x = 0;
  let i = 0;
  while (x < width) {
    const r = Math.abs(Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1;
    const w = 70 + r * 110;
    const h = 90 + ((r * 7) % 1) * (height - 90);
    blocks.push(<rect key={i} x={x} y={height - h} width={w - 8} height={h} fill={color} />);
    x += w;
    i++;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {blocks}
    </svg>
  );
};

export const Icon: React.FC<{ name: string; width: number }> = ({ name, width }) => {
  switch (name) {
    case "factory":
      return <Factory width={width} />;
    case "warehouse":
      return <Warehouse width={width} />;
    case "clinic":
      return <Clinic width={width} />;
    case "pharmacy":
      return <Pharmacy width={width} />;
    case "sun":
      return <Sun width={width} />;
    case "snowflake":
      return <Snowflake width={width} />;
    case "vial":
      return <Vial width={width * 0.5} />;
    case "fridge":
      return <Fridge width={width * 0.6} />;
    case "truck":
      return <Truck width={width} />;
    case "box":
      return <ColdBox width={width} />;
    case "logger":
      return <Logger width={width} />;
    case "syringe":
      return <Syringe width={width} />;
    case "arm":
      return <Arm width={width} />;
    default:
      return null;
  }
};
