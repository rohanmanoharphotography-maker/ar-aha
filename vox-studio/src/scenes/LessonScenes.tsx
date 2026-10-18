// Scene templates for physics / maths lessons on the wide (1760×880) stage:
// hook, energy transfers, key-idea card, Sankey, worked equations, collision
// diagrams, before/after comparison, mistakes checklist and exam questions.
import React from "react";
import { Easing, interpolate, useVideoConfig } from "remotion";
import { draw, enter, float, progress, ramp, rand } from "../animations/motion";
import { Camera } from "../components/Camera";
import { BarChart } from "../components/Charts";
import { EnergyStore, EquationBoard, FlowArrow, GivenCard, MathText, PauseBadge, Sankey, Sticky } from "../components/Lesson";
import { AnimatedTitle, Kicker, Marker, Stamp } from "../components/Typography";
import { Bullet, Cartridge, Flame, MassTag, SoundWaves, Splinter, Wind, WOOD_DARK, WoodBlock } from "../illustrations/physics";
import { useSceneDuration, useSceneFrame } from "../lib/layout";
import { C, FONT, SHADOW, paperCut } from "../lib/theme";
import type { SceneProps } from "../lib/types";
import { At, Footnote, Pop, Rise, Tag, useCue } from "./helpers";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const PauseSlot: React.FC = () => (
  <At x={1060} y={-10} w={700} style={{ display: "flex", justifyContent: "flex-end" }} z={50}>
    <PauseBadge />
  </At>
);

/** Speed lines trailing a moving object. */
const SpeedLines: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg width={360} height={80} style={{ position: "absolute", left: -380, top: 0, opacity }}>
    {[14, 40, 66].map((y, i) => (
      <line key={y} x1={i * 40} x2={340} y1={y} y2={y} stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
    ))}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

/** Hook: a bullet flies in at speed, stops dead in a block; the question lands. */
export const BulletHookScene: React.FC<SceneProps<{ speed: number; question: string[] }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const cue = useCue(scene);
  const fly = cue("fly", 0.05);
  const stop = cue("stop", 0.35);
  const q = cue("question", 0.5);
  // the bullet crosses the frame and buries its tip in the block face (x = 1180)
  const bx = interpolate(frame, [fly, stop], [-420, 1180 + 70 - 240], { ...clamp, easing: Easing.in(Easing.quad) });
  const moving = frame >= fly && frame < stop;
  const speed = frame < stop ? props.speed : Math.round(interpolate(frame, [stop, stop + 4], [props.speed, 0], clamp));
  const shake = frame >= stop && frame < stop + 12 ? Math.sin((frame - stop) * 2.4) * (12 - (frame - stop)) : 0;
  return (
    <Camera zoom={[1, 1.05]} drift={[10, 0]} punchAt={stop} punch={0.04}>
      <At x={0} y={0}>
        <Kicker text="A puzzle" start={2} />
      </At>
      {/* speed readout */}
      <At x={0} y={70}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: C.inkSoft }}>SPEED</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 150, letterSpacing: -6, color: frame >= stop ? C.warm : C.cold, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {speed} <span style={{ fontSize: 70 }}>m/s</span>
        </div>
      </At>
      {/* floor line */}
      <At x={-100} y={790} w={1960} h={6} style={{ background: C.ink, opacity: 0.25 }}>
        <span />
      </At>
      {/* bullet (midground) — the block (foreground) occludes its buried tip */}
      <At x={bx} y={545} z={2}>
        <SpeedLines opacity={moving ? 1 : 0} />
        <div style={{ filter: paperCut(C.warm, -10, 6) }}>
          <Bullet width={240} />
        </div>
      </At>
      <At x={1180} y={330} z={3} style={{ transform: `translateX(${shake}px)` }}>
        <Rise at={0} distance={300}>
          <div style={{ filter: paperCut(C.cold, 14, 10) }}>
            <WoodBlock width={460} />
          </div>
        </Rise>
      </At>
      {/* splinters on impact */}
      {frame >= stop
        ? Array.from({ length: 7 }).map((_, i) => {
            const t = (frame - stop) / fps;
            const ang = -Math.PI / 2 - 1.2 + rand(i + 3) * 2.2;
            const v = 500 + rand(i + 9) * 500;
            const x = 1180 + Math.cos(ang) * v * t * -0.6;
            const y = 560 + Math.sin(ang) * v * t + 900 * t * t;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: 26, height: 8, background: WOOD_DARK, transform: `rotate(${frame * 20 + i * 40}deg)`, opacity: t < 0.8 ? 1 : 0 }} />
            );
          })
        : null}
      <At x={1190} y={250} z={4}>
        <Pop at={stop + 2}>
          <Tag size={30} bg={C.warm}>
            0.1 s later: stopped
          </Tag>
        </Pop>
      </At>
      <At x={0} y={300} z={5}>
        <AnimatedTitle lines={props.question} start={q - 4} size={112} highlight="ENERGY" />
      </At>
      <PauseSlot />
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Energy transfers: chemical → kinetic → (air) → thermal + sound + deforming. */
export const TransfersScene: React.FC<SceneProps<{ kicker: string }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const [chem, ke, air, hit, work, thermal, sound, deform] = ["chem", "ke", "air", "hit", "work", "thermal", "sound", "deform"].map((k, i) => cue(k, 0.1 + i * 0.1));
  const lvl = (a: number, b: number, from: number, to: number) => interpolate(frame, [a, b], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const chemFill = lvl(ke - 6, ke + 30, 0.9, 0.12);
  const keFill = frame < work ? lvl(ke, ke + 30, 0, 0.82) - lvl(air, air + 20, 0, 0.06) : lvl(work, work + 50, 0.76, 0);
  return (
    <Camera zoom={[1, 1.03]} drift={[-10, 0]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <svg width={1760} height={880} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <FlowArrow d="M 300 390 L 470 390" start={ke - 8} color={C.amber} head={{ x: 490, y: 390, angle: 0 }} />
        <FlowArrow d="M 690 290 C 720 200, 760 150, 820 140" start={air - 4} color={C.cold} width={6} head={{ x: 835, y: 138, angle: -5 }} />
        <FlowArrow d="M 760 390 L 1010 390" start={work - 6} color={C.warm} head={{ x: 1030, y: 390, angle: 0 }} />
        <FlowArrow d="M 1090 380 C 1180 300, 1220 170, 1290 150" start={thermal - 8} color={C.warm} head={{ x: 1306, y: 147, angle: -10 }} />
        <FlowArrow d="M 1090 400 C 1180 400, 1220 410, 1290 410" start={sound - 8} color={C.inkSoft} head={{ x: 1306, y: 410, angle: 0 }} />
        <FlowArrow d="M 1090 420 C 1180 500, 1220 660, 1290 670" start={deform - 8} color={WOOD_DARK} head={{ x: 1306, y: 672, angle: 8 }} />
      </svg>
      <At x={40} y={280}>
        <EnergyStore label="Chemical store" sub="the gunpowder" icon={<Cartridge width={170} />} color={C.amber} fill={chemFill} at={chem - 4} />
      </At>
      <At x={500} y={280}>
        <EnergyStore label="Kinetic store" sub="the moving bullet" icon={<Bullet width={150} />} color={C.cold} fill={keFill} at={ke - 4} />
      </At>
      <At x={850} y={90}>
        <Pop at={air}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Wind width={70} />
            <div>
              <Tag size={26} bg={C.cold}>
                Air resistance
              </Tag>
              <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 24, color: C.inkSoft, marginTop: 4 }}>a little to the surroundings</div>
            </div>
          </div>
        </Pop>
      </At>
      <At x={1040} y={330}>
        <Pop at={hit}>
          <div style={{ filter: paperCut(C.warm, 6, 4) }}>
            <WoodBlock width={110} />
          </div>
        </Pop>
      </At>
      <At x={760} y={420}>
        <Pop at={work}>
          <div style={{ background: C.card, border: `4px solid ${C.warm}`, padding: "10px 16px", filter: SHADOW, width: 250 }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 34, color: C.warm }}>WORK DONE</div>
            <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 24, color: C.inkSoft }}>by the wood's resistive force</div>
          </div>
        </Pop>
      </At>
      <At x={1320} y={60}>
        <EnergyStore label="Thermal store" sub="bullet + wood warm up" icon={<Flame width={70} />} color={C.warm} fill={lvl(thermal, thermal + 40, 0, 0.6)} at={thermal - 4} size={170} labelSide="right" />
      </At>
      <At x={1320} y={325}>
        <EnergyStore label="Sound" sub="the thud" icon={<SoundWaves width={90} />} color={C.ice} fill={lvl(sound, sound + 30, 0, 0.25)} at={sound - 4} size={170} labelSide="right" />
      </At>
      <At x={1320} y={590}>
        <EnergyStore label="Deforming" sub="splitting the wood" icon={<Splinter width={90} />} color="#DDB57A" fill={lvl(deform, deform + 30, 0, 0.4)} at={deform - 4} size={170} labelSide="right" />
      </At>
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Key idea: energy is conserved, but dissipated (with a particle-spreading visual). */
export const ConservationScene: React.FC<SceneProps<{ kicker: string }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const cue = useCue(scene);
  const destroyed = cue("destroyed", 0.05);
  const conserved = cue("conserved", 0.3);
  const dissipated = cue("dissipated", 0.55);
  const spread = progress(frame, dissipated, cue("useless", 0.85) + 20, Easing.out(Easing.cubic));
  const strike = progress(frame, destroyed + 6, destroyed + 16);
  return (
    <Camera zoom={[1, 1.04]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={0} y={80}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, letterSpacing: -3, color: C.ink, lineHeight: 1 }}>ENERGY IS NEVER</div>
        <div style={{ position: "relative", display: "inline-block", fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, letterSpacing: -3, color: C.ink, lineHeight: 1.1 }}>
          DESTROYED
          <div style={{ position: "absolute", left: -6, right: -6, top: "48%", height: 12, background: C.warm, transform: `scaleX(${strike}) rotate(-2deg)`, transformOrigin: "left" }} />
        </div>
      </At>
      {[
        { at: conserved, title: "Conservation of energy", body: "Energy cannot be created or destroyed. It is only transferred between stores.", y: 345, color: C.cold },
        { at: dissipated, title: "Dissipated", body: "Spread out into the surroundings, mostly as thermal energy, so it is much less useful.", y: 585, color: C.warm },
      ].map((k, i) => {
        const p = enter(frame, fps, k.at - 4);
        return (
          <At key={i} x={0} y={k.y} w={820}>
            <div style={{ transform: `translateY(${(1 - p) * 160}px) rotate(${i ? 0.8 : -0.8}deg)`, opacity: ramp(frame, k.at - 4, 10), background: C.card, borderLeft: `14px solid ${k.color}`, padding: "18px 26px", filter: SHADOW }}>
              <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: C.inkSoft }}>KEY TERM</div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 52, color: C.ink, letterSpacing: -1 }}>
                <Marker start={k.at + 6} color={i ? C.highlight : C.iceLight}>
                  {k.title}
                </Marker>
              </div>
              <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 32, color: C.inkSoft, marginTop: 6, lineHeight: 1.25 }}>{k.body}</div>
            </div>
          </At>
        );
      })}
      {/* dissipation: a concentrated hot cluster spreads into the surroundings and cools */}
      <At x={980} y={140} w={740} h={620}>
        <div style={{ position: "absolute", inset: 0, border: `4px dashed ${C.rule}`, borderRadius: 24, opacity: ramp(frame, conserved, 12) }} />
        <div style={{ position: "absolute", left: 20, top: 16, fontFamily: FONT.mono, fontWeight: 600, fontSize: 22, letterSpacing: 2, color: C.inkSoft, opacity: ramp(frame, conserved, 12) }}>
          SAME TOTAL ENERGY · {spread > 0.5 ? "SPREAD OUT" : "CONCENTRATED"}
        </div>
        {Array.from({ length: 70 }).map((_, i) => {
          const a = rand(i) * Math.PI * 2;
          const r0 = rand(i + 50) * 40;
          const r1 = 60 + rand(i + 100) * 290;
          const r = r0 + (r1 - r0) * spread;
          const x = 370 + Math.cos(a) * r * 1.0 + float(frame, 3, 40 + (i % 7) * 6, i * 9) * spread;
          const y = 320 + Math.sin(a) * r * 0.85 + float(frame, 3, 50 + (i % 5) * 6, i * 5) * spread;
          const col = spread < 0.5 ? C.warm : C.amber;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 18, borderRadius: 9, background: col, opacity: (frame >= conserved ? 1 : 0) * (1 - spread * 0.55) }} />;
        })}
      </At>
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Sankey (energy flow) diagram for the bullet, with efficiency definition. */
export const SankeyScene: React.FC<SceneProps<{ kicker: string; footnote?: string }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const start = cue("draw", 0.05);
  const eff = cue("efficiency", 0.75);
  const W = "#C9433A";
  return (
    <Camera zoom={[1.02, 1.0]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={0} y={120} style={{ opacity: ramp(frame, start, 10) }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, color: C.ink, width: 230, lineHeight: 1.25 }}>CHEMICAL STORE</div>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 26, color: C.inkSoft }}>total input</div>
      </At>
      <At x={0} y={60}>
        <Sankey
          width={1380}
          height={800}
          start={start}
          end={start + 110}
          bands={[
            { x0: 0, y0: 230, x1: 260, y1: 230, w: 200, color: C.amber },
            { x0: 260, y0: 360, x1: 560, y1: 610, w: 70, color: W, arrow: true, label: "Thermal + sound in the gun", sub: "wasted" },
            { x0: 260, y0: 230, x1: 700, y1: 230, w: 130, color: C.cold },
            { x0: 700, y0: 230, x1: 980, y1: 80, w: 12, color: W, arrow: true, label: "Air resistance", sub: "heats the air" },
            { x0: 700, y0: 242, x1: 1060, y1: 242, w: 118, color: C.cold, label: "", sub: "" },
            { x0: 1060, y0: 242, x1: 1300, y1: 150, w: 70, color: W, arrow: true, label: "Thermal store", sub: "bullet + wood" },
            { x0: 1060, y0: 312, x1: 1300, y1: 360, w: 18, color: C.inkSoft, arrow: true, label: "Sound" },
            { x0: 1060, y0: 330, x1: 1300, y1: 530, w: 30, color: WOOD_DARK, arrow: true, label: "Deforming the wood" },
          ]}
        />
      </At>
      <At x={360} y={300} style={{ opacity: ramp(frame, start + 40, 10) }}>
        <Tag size={24} bg={C.cold}>
          Kinetic store (useful)
        </Tag>
      </At>
      <At x={1250} y={628} w={500}>
        <Rise at={eff - 6} distance={140}>
          <div style={{ background: C.card, border: `4px solid ${C.ink}`, padding: "14px 22px", filter: SHADOW }}>
            <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: C.inkSoft }}>KEY TERM · EFFICIENCY</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 34, color: C.ink, marginTop: 4, lineHeight: 1.25 }}>
              efficiency =<br />
              <Marker start={eff + 6}>useful energy output</Marker>
              <br />÷ total energy input
            </div>
            <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 24, color: C.inkSoft, marginTop: 2 }}>(× 100% to give a percentage)</div>
          </div>
        </Rise>
      </At>
      {props.footnote ? (
        <At x={0} y={850}>
          <Footnote text={props.footnote} at={start + 20} />
        </At>
      ) : null}
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const StoppingDiagram: React.FC<{ at: number }> = ({ at }) => {
  const frame = useSceneFrame();
  const dim = draw(frame, at + 10, at + 26);
  // cut-away: the block's front face (x 240–600, y 80–340) shows the bullet 8 cm inside it
  return (
    <div style={{ position: "relative", width: 700, height: 340 }}>
      <div style={{ position: "absolute", left: 240, top: 20, filter: paperCut(C.cold, 10, 8) }}>
        <WoodBlock width={420} />
      </div>
      <svg width={700} height={340} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={244} y1={196} x2={400} y2={196} stroke="#3B2A16" strokeWidth={10} strokeDasharray="4 8" opacity={0.6} />
      </svg>
      <div style={{ position: "absolute", left: 244 + 156 - 140, top: 172 }}>
        <Bullet width={140} />
      </div>
      <svg width={700} height={340} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={236} y={262} width={186} height={56} fill={C.ink} opacity={dim < 0.1 ? 0.85 : 0} rx={6} />
        <line x1={244} y1={250} x2={400} y2={250} stroke={C.ink} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={dim} />
        <line x1={244} y1={236} x2={244} y2={264} stroke={C.ink} strokeWidth={5} opacity={dim < 0.95 ? 1 : 0} />
        <line x1={400} y1={236} x2={400} y2={264} stroke={C.ink} strokeWidth={5} opacity={dim < 0.05 ? 1 : 0} />
        <text x={329} y={300} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={32} fill={C.card} opacity={dim < 0.1 ? 1 : 0}>
          d = 8 cm
        </text>
        {/* resistive force on the bullet, pointing back */}
        <g opacity={ramp(frame, at + 20, 8)}>
          <line x1={226} y1={196} x2={60} y2={196} stroke={C.warm} strokeWidth={12} strokeLinecap="round" />
          <path d="M34 196 L66 174 L66 218 Z" fill={C.warm} />
          <text x={30} y={150} fontFamily={FONT.sans} fontWeight={900} fontSize={40} fill={C.warm}>
            F
          </text>
          <text x={74} y={150} fontFamily={FONT.serif} fontStyle="italic" fontSize={26} fill={C.inkSoft}>
            from the wood
          </text>
        </g>
      </svg>
    </div>
  );
};

const CollisionMini: React.FC<{ at: number }> = ({ at }) => {
  const frame = useSceneFrame();
  return (
    <div style={{ position: "relative", width: 700, height: 300, opacity: ramp(frame, at, 10) }}>
      {[
        { y: 20, title: "BEFORE", after: false },
        { y: 160, title: "AFTER", after: true },
      ].map((row, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: row.y, width: 700, height: 130 }}>
          <div style={{ position: "absolute", left: 0, top: 0, fontFamily: FONT.mono, fontWeight: 600, fontSize: 22, letterSpacing: 3, color: C.inkSoft }}>{row.title}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 118, height: 5, background: C.ink, opacity: 0.4 }} />
          {!row.after ? (
            <>
              <div style={{ position: "absolute", left: 90, top: 68 }}>
                <Bullet width={90} />
              </div>
              <div style={{ position: "absolute", left: 60, top: 40, fontFamily: FONT.sans, fontWeight: 800, fontSize: 24, color: C.cold }}>400 m/s →</div>
              <div style={{ position: "absolute", left: 360, top: 34, width: 120, height: 84, background: "#C99A5B", border: `4px solid ${C.ink}` }} />
              <div style={{ position: "absolute", left: 368, top: 58, fontFamily: FONT.sans, fontWeight: 900, fontSize: 26 }}>2.0 kg</div>
              <div style={{ position: "absolute", left: 500, top: 70, fontFamily: FONT.sans, fontWeight: 800, fontSize: 24, color: C.inkSoft }}>at rest</div>
            </>
          ) : (
            <>
              <div style={{ position: "absolute", left: 360, top: 34, width: 120, height: 84, background: "#C99A5B", border: `4px solid ${C.ink}` }} />
              <div style={{ position: "absolute", left: 368, top: 58, fontFamily: FONT.sans, fontWeight: 900, fontSize: 24 }}>2.010 kg</div>
              <div style={{ position: "absolute", left: 500, top: 56, fontFamily: FONT.sans, fontWeight: 900, fontSize: 32, color: C.cold }}>v → ?</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

type EqProps = {
  kicker: string;
  question: string;
  given: { sym: string; value: string; convert?: string }[];
  lines: { text: string; result?: boolean }[];
  note?: { text: string };
  convertNote?: { text: string };
  diagram?: "stopping" | "collision-mini";
};

/** Worked example: question, given values (with unit conversion), diagram, equation lines. */
export const EquationScene: React.FC<SceneProps<EqProps>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const dur = useSceneDuration();
  const lineAt = (i: number) => scene.cues[`lines.${i}`] ?? Math.round(dur * (0.3 + i * 0.2));
  return (
    <Camera zoom={[1, 1.03]} drift={[0, -8]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <PauseSlot />
      <At x={0} y={70} w={720}>
        <Rise at={2} distance={120}>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700, fontSize: 40, color: C.ink, lineHeight: 1.25 }}>{props.question}</div>
        </Rise>
      </At>
      <At x={0} y={props.diagram ? 230 : 280}>
        <GivenCard
          start={8}
          width={700}
          items={props.given.map((g, i) => ({ ...g, at: scene.cues[`given.${i}`] }))}
        />
      </At>
      {props.diagram === "stopping" ? (
        <At x={0} y={540}>
          <StoppingDiagram at={cue("given.1", 0.4)} />
        </At>
      ) : null}
      {props.diagram === "collision-mini" ? (
        <At x={0} y={560}>
          <CollisionMini at={10} />
        </At>
      ) : null}
      {props.convertNote ? (
        <At x={40} y={620}>
          <Sticky text={props.convertNote.text} at={cue("convertNote", 0.4)} rotate={-2} />
        </At>
      ) : null}
      <At x={820} y={150} w={940}>
        <EquationBoard lines={props.lines.map((l, i) => ({ ...l, at: lineAt(i) }))} size={props.lines.length > 3 ? 58 : 66} />
      </At>
      {props.note ? (
        <At x={1180} y={650}>
          <Sticky text={props.note.text} at={cue("note", 0.9)} width={540} />
        </At>
      ) : null}
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Extended set-up: bullet + block on a smooth surface, before → after. */
export const CollisionScene: React.FC<SceneProps<{ kicker: string }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const block = cue("block", 0.35);
  const smooth = cue("smooth", 0.5);
  const embed = cue("embed", 0.65);
  const slide = cue("slide", 0.85);
  const bx = interpolate(frame, [embed - 14, embed], [20, 470 - 150 + 40], { ...clamp, easing: Easing.in(Easing.quad) });
  const slideX = interpolate(frame, [slide, slide + 120], [0, 90], clamp);
  return (
    <Camera zoom={[1, 1.03]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      {[0, 1].map((i) => (
        <At key={i} x={i ? 920 : 0} y={130} w={840} h={560}>
          <div style={{ position: "absolute", inset: 0, background: i ? C.iceLight : C.card, opacity: ramp(frame, i ? slide - 6 : block - 6, 10), filter: SHADOW }} />
          <div style={{ position: "absolute", left: 30, top: 24, fontFamily: FONT.sans, fontWeight: 900, fontSize: 48, color: C.ink, opacity: ramp(frame, i ? slide - 6 : block - 6, 10) }}>{i ? "AFTER" : "BEFORE"}</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 430, height: 8, background: C.ink, opacity: ramp(frame, smooth - 4, 10) * (i ? ramp(frame, slide, 8) : 1) }} />
        </At>
      ))}
      <At x={30} y={580}>
        <Pop at={smooth}>
          <Tag size={26}>Smooth surface: no friction</Tag>
        </Pop>
      </At>
      {/* BEFORE panel */}
      <At x={470} y={330} z={3}>
        <Rise at={block - 4} distance={200}>
          <div style={{ width: 260, height: 230, background: "#C99A5B", border: `5px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", filter: paperCut(C.cold, 10, 8) }}>
            <MassTag text="m₂ = 2.0 kg" />
          </div>
        </Rise>
      </At>
      <At x={bx} y={420} z={frame >= embed ? 2 : 4}>
        <div style={{ opacity: ramp(frame, 2, 8) }}>
          <Bullet width={150} />
        </div>
      </At>
      <At x={40} y={300} z={4}>
        <Pop at={4}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 30, color: C.cold }}>
            <MathText text="m_1 = 0.010 kg   u_1 = 400 m/s →" />
          </div>
        </Pop>
      </At>
      <At x={560} y={260} z={4}>
        <Pop at={block + 6}>
          <Tag size={24} bg={C.inkSoft}>
            at rest
          </Tag>
        </Pop>
      </At>
      {/* AFTER panel */}
      <At x={1190 + slideX} y={330} z={3} style={{ opacity: ramp(frame, slide - 2, 8) }}>
        <div style={{ width: 260, height: 230, background: "#C99A5B", border: `5px solid ${C.ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, filter: paperCut(C.cold, 10, 8) }}>
          <MassTag text="2.010 kg" />
          <div style={{ fontFamily: FONT.mono, fontSize: 20, fontWeight: 600 }}>(block + bullet)</div>
        </div>
      </At>
      <At x={1480 + slideX} y={400} z={4}>
        <Pop at={slide + 4}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 56, color: C.cold }}>v → ?</div>
        </Pop>
      </At>
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Kinetic energy before vs after: real numbers, energy lost, "inelastic" stamp. */
export const KECompareScene: React.FC<SceneProps<{ kicker: string; lines: { text: string; result?: boolean }[]; before: number; after: number; lost: number }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const before = cue("before", 0.5);
  const lost = cue("lost", 0.65);
  const stamp = cue("stamp", 0.9);
  const lostP = progress(frame, lost - 10, lost + 10, Easing.out(Easing.cubic));
  return (
    <Camera zoom={[1, 1.04]} punchAt={stamp} punch={0.03}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={0} y={110} w={900}>
        <EquationBoard lines={props.lines.map((l, i) => ({ ...l, at: scene.cues[`lines.${i}`] ?? 20 + i * 60 }))} size={54} />
      </At>
      <At x={1060} y={120}>
        <BarChart
          bars={[
            { label: "BEFORE", value: props.before, color: C.cold },
            { label: "AFTER", value: props.after, color: C.ice },
          ]}
          max={props.before * 1.12}
          width={600}
          height={520}
          start={before - 6}
          stagger={Math.max(6, cue("after", 0.6) - before)}
          unit=" J"
        />
      </At>
      <At x={0} y={470} w={900}>
        <div style={{ opacity: ramp(frame, lost - 10, 8) }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: C.inkSoft }}>KINETIC ENERGY TRANSFERRED AWAY</div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 130, letterSpacing: -5, color: C.warm, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            ≈ {Math.round(props.lost * lostP)} J
          </div>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 34, color: C.inkSoft }}>800 J − 4 J: over 99% of it</div>
        </div>
      </At>
      <At x={380} y={720}>
        <Stamp text="INELASTIC COLLISION" sub="kinetic energy not conserved" start={stamp} size={58} rotate={-4} />
      </At>
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Where the energy went + momentum vs kinetic-energy comparison table. */
export const WhereScene: React.FC<SceneProps<{ kicker: string }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const cue = useCue(scene);
  const rows = [
    { q: "Momentum", before: "4.0 kg m/s", after: "4.0 kg m/s", ok: true, at: cue("momentum", 0.6) },
    { q: "Kinetic energy", before: "800 J", after: "≈ 4 J", ok: false, at: cue("ke", 0.8) },
  ];
  return (
    <Camera zoom={[1.03, 1.0]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      <At x={0} y={80} w={1760} style={{ display: "flex", justifyContent: "space-around" }}>
        <EnergyStore label="Thermal store" sub="bullet + block" icon={<Flame width={70} />} color={C.warm} fill={0.7} at={cue("thermal", 0.1) - 4} size={180} />
        <EnergyStore label="Sound" icon={<SoundWaves width={90} />} color={C.ice} fill={0.2} at={cue("sound", 0.3) - 4} size={180} />
        <EnergyStore label="Deforming" sub="the wood" icon={<Splinter width={90} />} color="#DDB57A" fill={0.4} at={cue("deform", 0.45) - 4} size={180} />
      </At>
      <At x={160} y={430} w={1440}>
        <div style={{ display: "grid", gridTemplateColumns: "420px 320px 320px 380px", rowGap: 18, fontFamily: FONT.sans, alignItems: "center", opacity: ramp(frame, rows[0].at - 8, 10) }}>
          {["", "BEFORE", "AFTER", ""].map((h, i) => (
            <div key={i} style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: C.inkSoft }}>{h}</div>
          ))}
          {rows.map((r) => (
            <React.Fragment key={r.q}>
              <div style={{ fontWeight: 900, fontSize: 48, opacity: ramp(frame, r.at - 4, 8) }}>{r.q}</div>
              <div style={{ fontWeight: 700, fontSize: 48, opacity: ramp(frame, r.at - 4, 8) }}>{r.before}</div>
              <div style={{ fontWeight: 700, fontSize: 48, opacity: ramp(frame, r.at, 8) }}>{r.after}</div>
              <Pop at={r.at + 6}>
                <Tag size={34} bg={r.ok ? C.ok : C.warm}>
                  {r.ok ? "✓ conserved" : "✗ not conserved"}
                </Tag>
              </Pop>
            </React.Fragment>
          ))}
        </div>
      </At>
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Common mistakes: wrong (struck) → right, one card per mistake. */
export const MistakesScene: React.FC<SceneProps<{ kicker: string; items: { wrong: string; right: string }[] }>> = ({ scene, props }) => {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  return (
    <Camera zoom={[1, 1.03]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      {props.items.map((it, i) => {
        const at = scene.cues[`items.${i}`] ?? 30 + i * 60;
        const p = enter(frame, fps, at - 6);
        const strike = progress(frame, at + 4, at + 14);
        return (
          <At key={i} x={(i % 2) * 890} y={90 + Math.floor(i / 2) * 390} w={850}>
            <div style={{ transform: `translateY(${(1 - p) * 200}px) rotate(${i % 2 ? 0.7 : -0.7}deg)`, opacity: ramp(frame, at - 6, 10), background: C.card, padding: "26px 30px", filter: SHADOW, height: 330 }}>
              <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: C.inkSoft }}>MISTAKE {i + 1}</div>
              <div style={{ position: "relative", display: "inline-block", fontFamily: FONT.sans, fontWeight: 800, fontSize: 46, color: C.warm, marginTop: 10 }}>
                ✗ <MathText text={it.wrong} />
                <div style={{ position: "absolute", left: 50, right: -6, top: "52%", height: 6, background: C.warm, transform: `scaleX(${strike})`, transformOrigin: "left" }} />
              </div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 40, color: C.ok, marginTop: 24, lineHeight: 1.2, opacity: ramp(frame, at + 12, 10) }}>
                ✓ <MathText text={it.right} style={{ whiteSpace: "normal", color: C.ink }} />
              </div>
            </div>
          </At>
        );
      })}
    </Camera>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/** Exam-style practice questions (mark schemes live in the companion worksheet). */
export const QuestionsScene: React.FC<SceneProps<{ kicker: string; questions: { tag: string; marks: number; text: string }[] }>> = ({ scene, props }) => {
  const cue = useCue(scene);
  const cards = cue("cards", 0.2);
  return (
    <Camera zoom={[1, 1.03]}>
      <At x={0} y={0}>
        <Kicker text={props.kicker} start={0} />
      </At>
      {props.questions.map((q, i) => (
        <At key={i} x={i * 590} y={90} w={560}>
          <Rise at={cards - 10 + i * 10} distance={260} rotate={i === 1 ? 0.6 : -0.6}>
            <div style={{ background: C.card, padding: "26px 28px", filter: SHADOW, height: 560, borderTop: `14px solid ${[C.cold, C.warm, C.ok][i]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Tag size={28} bg={[C.cold, C.warm, C.ok][i]}>
                  {`Q${i + 1} · ${q.tag}`}
                </Tag>
                <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 30, color: C.ink }}>[{q.marks}]</div>
              </div>
              <div style={{ fontFamily: FONT.serif, fontSize: 38, color: C.ink, marginTop: 26, lineHeight: 1.3 }}>{q.text}</div>
            </div>
          </Rise>
        </At>
      ))}
      <At x={0} y={700} w={1760}>
        <Rise at={cue("scheme", 0.6)} distance={100}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Tag size={34} bg={C.highlight} color={C.ink}>
              Mark scheme → worksheet.md
            </Tag>
            <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700, fontSize: 44, color: C.ink }}>You've got this.</div>
          </div>
        </Rise>
      </At>
    </Camera>
  );
};
