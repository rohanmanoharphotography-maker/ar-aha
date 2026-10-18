// Storyboard sources, in order of preference:
//   1. a hand-directed storyboard.json (input/<slug>/storyboard.json or --storyboard)
//   2. Claude-written storyboard from a topic (when Anthropic credentials exist)
//   3. auto-storyboard from a plain script (heuristic, generic scene templates)
import fs from "node:fs";
import path from "node:path";

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "video";

const ICONS = [
  [/vaccin|vial|dose|shot/i, "vial"],
  [/fridge|refrigerat|freezer|storage/i, "fridge"],
  [/truck|transport|ship|deliver/i, "truck"],
  [/box|packag|cooler/i, "box"],
  [/monitor|logger|record|sensor|data/i, "logger"],
  [/factory|manufactur|produc/i, "factory"],
  [/warehouse|distribut/i, "warehouse"],
  [/clinic|hospital|doctor|nurse/i, "clinic"],
  [/pharmac/i, "pharmacy"],
  [/heat|hot|warm|sun/i, "sun"],
  [/cold|ice|frozen|freez|snow/i, "snowflake"],
  [/inject|needle|syringe/i, "syringe"],
  [/arm|patient|you\b/i, "arm"],
];
const iconFor = (text) => ICONS.find(([re]) => re.test(text))?.[1];

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, hundred: 100 };

/** Split a script into beats: one per non-empty line, or per sentence for prose. */
export const scriptToBeats = (text) => {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const chunks = lines.length > 1 ? lines : text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text];
  return chunks.map((t, i) => ({ id: i + 1, text: t.trim() })).filter((b) => b.text);
};

/** Heuristic storyboard for an arbitrary script (generic templates only). */
export const autoStoryboard = ({ beats, title, topic, duration }) => {
  const scenes = [];
  const keywords = new Set();
  const clean = (w) => w.replace(/[^\w'-]/g, "");
  const usedFocus = new Set();
  beats.forEach((b, i) => {
    const words = b.text.split(/\s+/);
    const digit = b.text.match(/(\d+(?:\.\d+)?)\s*(%|percent|°[CF]?)?/);
    const icon = iconFor(b.text);
    // long words become caption highlights (max 2 per beat); the longest is the scene's focus word
    const long = words.map(clean).filter((w) => w.length >= 7);
    long.slice(0, 2).forEach((w) => keywords.add(w.toLowerCase()));
    const focus = [...long].sort((a, z) => z.length - a.length).find((w) => !usedFocus.has(w.toLowerCase()));
    if (focus) usedFocus.add(focus.toLowerCase());
    const tone = /\b(heat|hot|warm|sun|sunset|fire|danger|risk)\b/i.test(b.text) ? "warm" : "cold";
    if (digit && i > 0) {
      keywords.add(digit[1]);
      scenes.push({
        id: `s${b.id}`,
        type: "stat",
        beats: [b.id],
        props: { value: Number(digit[1]), decimals: digit[1].includes(".") ? 1 : 0, suffix: digit[2] === "percent" ? "%" : digit[2] ?? "", label: b.text, cues: { value: digit[1] } },
      });
    } else if (i === 0) {
      // title = the opening clause (≤5 words), broken into ≤3 balanced lines
      const clause = b.text.split(/[,;:.!?—]/)[0].trim().split(/\s+/);
      const head = (clause.length <= 5 ? clause : words.slice(0, 4)).map(clean).join(" ").toUpperCase();
      const parts = head.split(" ");
      const per = Math.ceil(parts.length / Math.min(3, Math.max(1, Math.ceil(head.length / 11))));
      const lines = [];
      for (let k = 0; k < parts.length; k += per) lines.push(parts.slice(k, k + per).join(" "));
      scenes.push({ id: `s${b.id}`, type: "title", beats: [b.id], props: { kicker: topic || title, lines, highlight: focus?.toUpperCase(), icon } });
    } else {
      scenes.push({ id: `s${b.id}`, type: "kinetic", beats: [b.id], props: { icon, focus, tone, cues: focus ? { focus } : {} } });
    }
  });
  // spelled-out numbers become highlights too
  for (const b of beats) for (const w of b.text.toLowerCase().split(/\W+/)) if (NUMBER_WORDS[w]) keywords.add(w);
  return {
    slug: slugify(title || topic || beats[0]?.text || "video"),
    title: title || topic || "Explainer",
    topic: topic || title || "",
    style: "editorial",
    voice: "am_michael",
    targetDuration: duration,
    keywords: [...keywords],
    beats,
    scenes,
    sources: [],
    generatedBy: "auto-storyboard (heuristic)",
  };
};

/** Locate a pre-authored storyboard for a topic under input/. */
export const findTopicPack = (root, topic) => {
  const dir = path.join(root, "input");
  if (!fs.existsSync(dir)) return null;
  const want = slugify(topic);
  for (const d of fs.readdirSync(dir)) {
    const p = path.join(dir, d, "storyboard.json");
    if (!fs.existsSync(p)) continue;
    const sb = JSON.parse(fs.readFileSync(p, "utf8"));
    const keys = [d, sb.slug, slugify(sb.topic ?? ""), slugify(sb.title ?? "")];
    if (keys.includes(want)) return p;
    // fuzzy: most topic words present
    const tw = want.split("-").filter((w) => w.length > 3);
    const hay = `${sb.topic} ${sb.title}`.toLowerCase();
    if (tw.length && tw.filter((w) => hay.includes(w)).length / tw.length >= 0.6) return p;
  }
  return null;
};
