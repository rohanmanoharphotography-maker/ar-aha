// Turns storyboard + aligned timing into the render plan (Remotion props) and
// the SFX cue sheet. All frame numbers are derived from spoken words, so
// re-voicing never means re-tuning.

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9°']/g, "");

/** Find the first word (or phrase) in `words` matching `cue`; returns the word object. */
export const findCue = (words, cue) => {
  // "word#2" = the second time the word is spoken in this scene
  const [phrase, nth] = cue.split("#");
  let skip = Math.max(1, Number(nth) || 1) - 1;
  const parts = phrase.split(/\s+/).map(norm).filter(Boolean);
  for (let i = 0; i <= words.length - parts.length; i++) {
    let ok = true;
    for (let k = 0; k < parts.length; k++) {
      const w = norm(words[i + k].text);
      if (!(w === parts[k] || (parts[k].length >= 4 && w.startsWith(parts[k])))) {
        ok = false;
        break;
      }
    }
    if (ok && skip-- === 0) return words[i];
  }
  return null;
};

export const buildPlan = ({ storyboard, timing, captions, format, fps = 30, audio, transitionFrames = 12, showCaptions = true }) => {
  const total = Math.round(timing.duration * fps);
  const beatById = new Map(timing.beats.map((b) => [b.id, b]));
  const warnings = [];

  const raw = storyboard.scenes.map((s) => {
    const beats = s.beats.map((id) => beatById.get(id)).filter(Boolean);
    if (!beats.length) throw new Error(`scene "${s.id}" references no known beats`);
    return { s, start: Math.min(...beats.map((b) => b.start)) };
  });
  raw.sort((a, b) => a.start - b.start);

  const scenes = raw.map(({ s, start }, i) => {
    const from = i === 0 ? 0 : Math.max(0, Math.round((start - 0.12) * fps));
    return { s, from };
  });
  const out = scenes.map(({ s, from }, i) => {
    const next = i + 1 < scenes.length ? scenes[i + 1].from : total;
    const durationInFrames = Math.max(1, next - from);
    const t0 = from / fps;
    const words = timing.words
      .filter((w) => s.beats.includes(w.beat))
      .map((w) => ({ text: w.text, start: +(w.start - t0).toFixed(3), end: +(w.end - t0).toFixed(3), highlight: !!w.highlight }));
    const cues = {};
    const cueSpec = { ...(s.props?.cues ?? {}) };
    // split-scene sides carry their own cue words
    for (const side of ["left", "right"]) if (s.props?.[side]?.cue) cueSpec[s.props[side].cue] = s.props[side].cue;
    // list-style props (equation lines, given values, notes, checklist items) carry their own cue words
    for (const key of ["lines", "given", "items"]) (s.props?.[key] ?? []).forEach((it, k) => it?.cue && (cueSpec[`${key}.${k}`] = it.cue));
    for (const key of ["note", "convertNote"]) if (s.props?.[key]?.cue) cueSpec[key] = s.props[key].cue;
    for (const [name, word] of Object.entries(cueSpec)) {
      const hit = findCue(words, String(word));
      if (hit) cues[name] = Math.round(hit.start * fps);
      else warnings.push(`scene "${s.id}": cue "${name}" word "${word}" not spoken in this scene — using fallback timing`);
    }
    const { cues: _omit, ...props } = s.props ?? {};
    // practice pauses: the silence after any beat flagged with pauseAfter
    const pauses = s.beats
      .map((id) => ({ b: storyboard.beats.find((x) => x.id === id), t: beatById.get(id) }))
      .filter(({ b }) => b?.pauseAfter)
      .map(({ b, t }) => ({ start: Math.round((t.end - t0) * fps) + 4, end: Math.round((t.end + b.pauseAfter - t0) * fps) }));
    return { id: s.id, type: s.type, from, durationInFrames, cues, words, props, ...(pauses.length ? { pauses } : {}) };
  });

  return {
    plan: {
      title: storyboard.title,
      format,
      fps,
      durationInFrames: total,
      audio,
      scenes: out,
      captions,
      showCaptions,
      transitionFrames,
      ...(storyboard.stage ? { stage: storyboard.stage } : {}),
    },
    warnings,
  };
};

/** SFX cue sheet (seconds) mirroring what each scene template animates. */
export const buildSfxPlan = (plan) => {
  const { fps, transitionFrames: T } = plan;
  const ev = [];
  const at = (frame, name, gain = 1) => ev.push({ t: +(frame / fps).toFixed(3), name, gain });
  plan.scenes.forEach((s, i) => {
    const f = (c, fb = 0.3) => s.from + (s.cues[c] ?? Math.round(s.durationInFrames * fb));
    if (i > 0) at(s.from - T, "whoosh", 0.7);
    switch (s.type) {
      case "hook":
        at(f("title", 0.15), "pop", 0.8);
        at(f("eye", 0.8), "tick", 0.9);
        break;
      case "range":
        at(f("max", 0.6) + 2, "tick");
        at(f("min", 0.4) + 2, "tick");
        at(f("band", 0.75), "pop", 0.6);
        break;
      case "split":
        at(f(s.props.left?.cue ?? "left", 0.05), "pop", 0.7);
        at(f(s.props.right?.cue ?? "right", 0.5), "pop", 0.7);
        break;
      case "route": {
        const a = f("start", 0.15);
        const b = Math.max(a + 20, f("end", 0.9));
        const n = s.props.stops?.length ?? 3;
        for (let k = 0; k < n; k++) at(a + ((b - a) * k) / Math.max(1, n - 1) - 4, "ding", 0.5);
        break;
      }
      case "travel":
        at(f("truck", 0.05), "pop", 0.7);
        at(f("box", 0.45), "pop", 0.7);
        at(f("range", 0.85), "ding", 0.6);
        break;
      case "logger":
        at(f("device", 0.1), "pop", 0.7);
        at(f("clock", 0.8), "tick");
        break;
      case "indicator":
        at(f("label", 0.2), "pop", 0.7);
        at(f("heat", 0.8), "tick");
        break;
      case "fridge": {
        const c = f("checks", 0.55);
        const n = s.props.days?.length ?? 5;
        for (let k = 0; k < n; k++) at(c + (26 * k) / Math.max(1, n - 1), "tick", 0.8);
        break;
      }
      case "excursion":
        at(f("spike", 0.1) + 12, "alert", 0.8);
        at(f("stamp", 0.5), "stamp");
        break;
      case "closer":
        at(f("title", 0.45) - 4, "pop", 0.8);
        at(f("signoff", 0.8), "ding", 0.6);
        break;
      case "stat":
        at(f("value", 0.45), "tick");
        break;
      default:
        at(s.from + 4, "pop", 0.5);
        for (const v of Object.values(s.cues)) at(s.from + v, "tick", 0.45);
    }
  });
  return ev.filter((e) => e.t >= 0).sort((a, b) => a.t - b.t);
};
