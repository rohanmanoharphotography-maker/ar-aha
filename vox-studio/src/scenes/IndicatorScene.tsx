import React from "react";
import { Easing, interpolate, useVideoConfig } from "remotion";
import { enter, progress } from "../animations/motion";
import { Camera } from "../components/Camera";
import { Kicker } from "../components/Typography";
import { Sun, Vial } from "../illustrations";
import { useSceneFrame } from "../lib/layout";
import { C, FONT, SHADOW, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Pop, Rise, useCue } from "./helpers";

type Stage = { label: string; verdict: string; ok: boolean };
type Props = { kicker: string; stages: Stage[] };

const CIRCLE = "#6E5B8C";
const squareColor = (d: number) => {
  // d: 0 = light (fresh) … 1 = darker than the circle
  const r = Math.round(interpolate(d, [0, 1], [238, 70]));
  const g = Math.round(interpolate(d, [0, 1], [236, 52]));
  const b = Math.round(interpolate(d, [0, 1], [246, 96]));
  return `rgb(${r},${g},${b})`;
};

const VVM: React.FC<{ size: number; dark: number }> = ({ size, dark }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill={CIRCLE} stroke={C.ink} strokeWidth="4" />
    <rect x="27" y="27" width="46" height="46" fill={squareColor(dark)} stroke={C.ink} strokeWidth="1.5" />
  </svg>
);

/** Vaccine vial monitor: the heat-sensitive square darkens; legend shows the rule. */
export const IndicatorScene: React.FC<SceneProps<Props>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const cue = useCue(scene);
  const labelAt = cue("label", 0.2);
  const darkAt = cue("darken", 0.5);
  const heatAt = cue("heat", 0.8);
  const dark = progress(frame, darkAt - 4, heatAt + 14, Easing.inOut(Easing.cubic));
  const zoom = enter(frame, fps, labelAt, { damping: 18, stiffness: 100 });
  const bad = dark > 0.62;
  return (
    <Camera zoom={[1.0, 1.05]} drift={[0, -10]}>
      <At x={40} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={60} y={150}>
        <Rise at={0} distance={360} rotate={-6}>
          <div style={{ filter: paperCut(C.warm, 14, 10) }}>
            <Vial width={250} showVVM vvm={dark} label="VACCINE" />
          </div>
        </Rise>
      </At>
      {/* callout lens on the VVM */}
      <svg width={1000} height={1160} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: zoom }}>
        <line x1={240} y1={530} x2={500} y2={300} stroke={C.ink} strokeWidth={4} strokeDasharray="12 10" />
        <line x1={240} y1={560} x2={500} y2={720} stroke={C.ink} strokeWidth={4} strokeDasharray="12 10" />
      </svg>
      <At x={470} y={140}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "0% 50%", width: 470, height: 470, borderRadius: 235, background: C.card, border: `8px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", filter: SHADOW }}>
          <VVM size={360} dark={dark} />
        </div>
      </At>
      <At x={770} y={90}>
        <Pop at={heatAt - 6}>
          <Sun width={180} spin={frame * 2} />
        </Pop>
      </At>
      {props.stages.slice(0, 2).map((s, i) => {
        const active = i === 0 ? !bad && frame >= labelAt : bad;
        return (
          <At key={i} x={i === 0 ? 20 : 510} y={700} w={470}>
            <Rise at={labelAt + 6 + i * 8} distance={160}>
              <div
                style={{
                  background: C.card,
                  border: `5px solid ${active ? (s.ok ? C.ok : C.warm) : C.rule}`,
                  padding: "26px 24px",
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  filter: SHADOW,
                  transform: `scale(${active ? 1.03 : 0.97})`,
                  opacity: active ? 1 : 0.7,
                }}
              >
                <VVM size={110} dark={s.ok ? 0 : 1} />
                <div>
                  <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 44, color: s.ok ? C.ok : C.warm, lineHeight: 1 }}>{s.verdict}</div>
                  <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 25, color: C.inkSoft, marginTop: 10, lineHeight: 1.2 }}>{s.label}</div>
                </div>
              </div>
            </Rise>
          </At>
        );
      })}
      <At x={20} y={930} w={960}>
        <Rise at={heatAt} distance={80}>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 44, color: C.ink, textAlign: "center" }}>
            Heat exposure adds up — the square keeps a record.
          </div>
        </Rise>
      </At>
    </Camera>
  );
};
