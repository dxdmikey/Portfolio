import { describe, expect, it } from "vitest";
import { NovaDirector, type NovaLine } from "@/game/nova/director";
import { idleLine, linesForEvent, type NovaScript } from "@/game/nova/script";
import { novaScript, novaChapterLines, novaGreeting, novaRevisitLines } from "@/content/nova";
import { chapters } from "@/content/story";

function setup(opts: { cooldownMs?: number; maxQueue?: number } = {}) {
  let t = 0;
  const director = new NovaDirector({
    now: () => t,
    // A flat hold of `cooldownMs` whatever the length: round numbers for the tests.
    timing: { typeMsPerChar: 0, readMsPerChar: 0, readBaseMs: 0, minHoldMs: opts.cooldownMs ?? 1000 },
    maxQueue: opts.maxQueue,
  });
  return { director, advance: (ms: number) => void (t += ms) };
}

const L = (text: string, priority: NovaLine["priority"] = "chapter", repeatable = false): NovaLine => ({ text, priority, repeatable });
const C = (text: string, chapter: string): NovaLine => ({ text, priority: "chapter", chapter });

describe("NovaDirector", () => {
  it("speaks immediately when idle and holds the stage for the hold time", () => {
    const { director, advance } = setup();
    expect(director.push(L("a"))?.text).toBe("a");
    expect(director.busy).toBe(true);
    advance(1000);
    expect(director.busy).toBe(false);
  });

  it("queues equal/lower priority lines and drains them after the hold", () => {
    const { director, advance } = setup();
    director.push(L("a", "discovery"));
    expect(director.push(L("b", "chapter"))).toBeNull();
    expect(director.msUntilNext()).toBe(1000);
    expect(director.next()).toBeNull();
    advance(1000);
    expect(director.next()?.text).toBe("b");
    expect(director.msUntilNext()).toBeNull();
  });

  it("lets a higher priority line interrupt", () => {
    const { director } = setup();
    director.push(L("intro", "chapter"));
    expect(director.push(L("result", "result"))?.text).toBe("result");
    expect(director.push(L("disc", "discovery"))).toBeNull();
    expect(director.push(L("tip", "direct", true))?.text).toBe("tip");
  });

  it("never repeats a line in a session unless repeatable", () => {
    const { director, advance } = setup();
    director.push(L("a"));
    advance(2000);
    expect(director.push(L("a"))).toBeNull();
    expect(director.push(L("hint", "direct", true))?.text).toBe("hint");
    advance(2000);
    expect(director.push(L("hint", "direct", true))?.text).toBe("hint");
  });

  it("ignores a repeatable line that is already on stage", () => {
    const { director } = setup();
    director.push(L("hint", "direct", true));
    expect(director.push(L("hint", "direct", true))).toBeNull();
    expect(director.queued).toHaveLength(0);
  });

  it("orders the queue by priority and caps its length", () => {
    const { director } = setup({ maxQueue: 2 });
    director.push(L("on stage", "direct"));
    director.push(L("idle", "idle"));
    director.push(L("disc", "discovery"));
    director.push(L("res", "result"));
    expect(director.queued.map((q) => q.text)).toEqual(["res", "disc"]);
  });

  it("supersedes queued chapter lines with newer ones", () => {
    const { director } = setup();
    director.push(L("on stage", "direct"));
    director.push(C("ch2", "pilot"));
    director.push(C("ch3", "vit"));
    expect(director.queued.map((q) => q.text)).toEqual(["ch3"]);
    expect(director.hasSpoken("ch2")).toBe(false);
  });

  it("holds a line for its typing time plus a reading buffer, clamped", () => {
    const director = new NovaDirector({
      now: () => 0,
      timing: { typeMsPerChar: 10, readBaseMs: 100, readMsPerChar: 5, minHoldMs: 200, maxHoldMs: 1000 },
    });
    expect(director.holdMs(L("x".repeat(20)))).toBe(20 * 10 + 100 + 20 * 5);
    expect(director.holdMs(L("x"))).toBe(200);
    expect(director.holdMs(L("x".repeat(500)))).toBe(1000);
    // An emoji is one typed character.
    expect(director.holdMs(L("👋".repeat(20)))).toBe(400);
    director.setTypingSpeed(0);
    expect(director.holdMs(L("x".repeat(20)))).toBe(200);
  });

  it("a chapter line for another chapter interrupts the chapter line on stage", () => {
    const { director } = setup();
    expect(director.push(C("pilot hi", "pilot"))?.text).toBe("pilot hi");
    expect(director.push(C("vit hi", "vit"))?.text).toBe("vit hi");
    expect(director.currentChapter).toBe("vit");
  });

  it("a chapter line interrupts an idle line, but not a line of its own chapter", () => {
    const { director } = setup();
    director.force(L("joke", "idle", true));
    expect(director.push(C("vit 1", "vit"))?.text).toBe("vit 1");
    expect(director.push(C("vit 2", "vit"))).toBeNull();
    expect(director.queued.map((q) => q.text)).toEqual(["vit 2"]);
  });

  it("entering a new chapter drops queued idle lines and other chapters' lines", () => {
    const { director, advance } = setup();
    director.push(L("disc", "discovery"));
    director.push(C("pilot hi", "pilot"));
    director.push(L("tip", "idle"));
    expect(director.push(C("vit hi", "vit"))).toBeNull();
    expect(director.queued.map((q) => q.text)).toEqual(["vit hi"]);
    advance(1000);
    expect(director.next()?.text).toBe("vit hi");
    expect(director.hasSpoken("pilot hi")).toBe(false);
  });

  it("discovery lines win over chapter lines, which wait their turn", () => {
    const { director, advance } = setup();
    director.push(C("nebula hi", "nebula"));
    expect(director.push(L("found it", "discovery"))?.text).toBe("found it");
    expect(director.push(C("station hi", "station"))).toBeNull();
    advance(1000);
    expect(director.next()?.text).toBe("station hi");
  });

  it("never drops the current chapter's queued line when the queue overflows", () => {
    const { director } = setup({ maxQueue: 2 });
    director.push(L("on stage", "direct"));
    director.push(C("station hi", "station"));
    director.push(L("d1", "discovery"));
    director.push(L("d2", "discovery"));
    expect(director.queued.map((q) => q.text)).toEqual(["d1", "station hi"]);
  });

  it("drains only the line for the chapter you're in", () => {
    const { director, advance } = setup();
    director.push(L("on stage", "direct"));
    director.push(L("d1", "discovery"));
    director.push(C("pilot hi", "pilot"));
    director.push(C("vit hi", "vit"));
    advance(1000);
    expect(director.next()?.text).toBe("d1");
    advance(1000);
    expect(director.next()?.text).toBe("vit hi");
    expect(director.next()).toBeNull();
    expect(director.hasSpoken("pilot hi")).toBe(false);
  });

  it("force speaks even while busy", () => {
    const { director } = setup();
    director.push(L("a", "result"));
    expect(director.force(L("tip", "idle")).text).toBe("tip");
  });

  it("picks unspoken lines and cycles a pool once exhausted", () => {
    const { director } = setup();
    expect(director.pickUnspoken(["a", "b"])).toBe("a");
    director.force(L("a"));
    director.force(L("b"));
    expect(director.pickUnspoken(["a", "b"])).toBeNull();
    expect(director.pickCycling(["a", "b"])).toBe("a");
    expect(director.pickCycling([])).toBeNull();
  });
});

describe("NOVA script", () => {
  const script: NovaScript = {
    greeting: "hello",
    chapterLines: { nebula: ["n1", "n2"], pilot: ["p1"] },
    revisitLines: ["back at {chapter}", "{chapter} again"],
    chapterLabel: (id) => id.toUpperCase(),
    discoveryLine: (id) => (id === "rocket" ? "liftoff" : undefined),
    resultLines: {
      refinery: { win: ["rw"], lose: ["rl"] },
      station: { win: ["sw"], lose: ["sl"] },
    },
    idleLines: ["tip", "joke"],
  };

  type Ch = "nebula" | "pilot" | "vit";
  const enter = (chapter: Ch, director: NovaDirector) => linesForEvent({ type: "chapter:enter", chapter }, script, director);

  it("merges the greeting into the first chapter line, then gives the next unused intro", () => {
    const { director, advance } = setup();
    const first = enter("nebula", director);
    expect(first.map((l) => l.text)).toEqual(["hello n1"]);
    expect(first[0]).toMatchObject({ priority: "chapter", chapter: "nebula" });
    first.forEach((l) => director.force(l));
    expect(director.hasSpoken("n1")).toBe(true);
    expect(director.hasSpoken("hello")).toBe(true);
    advance(5000);
    expect(enter("nebula", director).map((l) => l.text)).toEqual(["n2"]);
  });

  it("says a rotating 'back at' line once a chapter's intros are used up", () => {
    const { director } = setup();
    const say = (chapter: Ch) => {
      const l = enter(chapter, director)[0];
      if (l) director.force(l);
      return l?.text;
    };
    expect([say("pilot"), say("pilot"), say("vit"), say("pilot"), say("pilot")]).toEqual([
      "hello p1",
      "back at PILOT",
      "VIT again",
      "back at PILOT",
      "PILOT again",
    ]);
  });

  it("reacts to first discoveries only", () => {
    const { director } = setup();
    expect(linesForEvent({ type: "discover", id: "rocket", first: true }, script, director)[0]?.priority).toBe("discovery");
    expect(linesForEvent({ type: "discover", id: "rocket", first: false }, script, director)).toEqual([]);
  });

  it("maps results, direct lines and ignores fx", () => {
    const { director } = setup();
    expect(linesForEvent({ type: "game:result", game: "station", outcome: "win" }, script, director)[0]).toMatchObject({ text: "sw", priority: "result" });
    expect(linesForEvent({ type: "nova:say", text: "hey" }, script, director)[0]).toMatchObject({ priority: "direct", repeatable: true });
    expect(linesForEvent({ type: "fx", kind: "burst", x: 0, y: 0, accent: "xp" }, script, director)).toEqual([]);
  });

  it("cycles idle lines forever", () => {
    const { director } = setup();
    const said = Array.from({ length: 3 }, () => {
      const l = idleLine(script, director);
      if (l) director.force(l);
      return l?.text;
    });
    expect(said).toEqual(["tip", "joke", "tip"]);
  });
});

describe("NOVA content", () => {
  it("has 2–3 intro lines for every chapter", () => {
    chapters.forEach((c) => {
      const lines = novaChapterLines[c.id];
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines.length).toBeLessThanOrEqual(3);
    });
  });

  it("has revisit lines that name the chapter", () => {
    expect(novaRevisitLines.length).toBeGreaterThanOrEqual(2);
    novaRevisitLines.forEach((l) => expect(l).toContain("{chapter}"));
    expect(novaScript.chapterLabel("station")).toBe("Navayuga Station");
  });

  it("resolves greetings and discovery lines", () => {
    expect(novaScript.greeting).toBe(novaGreeting);
    expect(novaScript.discoveryLine("rocket")).toMatch(/Liftoff/);
    expect(novaScript.discoveryLine("nope")).toBeUndefined();
  });

  it("never mentions a phone number", () => {
    const all = JSON.stringify(novaChapterLines) + novaScript.idleLines.join(" ") + novaRevisitLines.join(" ");
    expect(all).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
  });
});
