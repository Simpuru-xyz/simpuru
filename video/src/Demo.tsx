import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Agents, Close, Coworker, Hook, How, People, Problem, Protection } from "./scenes";

export const FPS = 30;
const T = 15; // cross-fade between scenes
const SCENES = [
  [Hook, 420],
  [Problem, 510],
  [How, 720],
  [People, 960],
  [Agents, 900],
  [Protection, 780],
  [Coworker, 600],
  [Close, 450],
] as const;

export const DEMO_FRAMES = SCENES.reduce((n, [, d]) => n + d, 0) - T * (SCENES.length - 1);

export const Demo = () => (
  <TransitionSeries>
    {SCENES.flatMap(([Scene, d], i) => [
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={d}>
        <Scene />
      </TransitionSeries.Sequence>,
      ...(i < SCENES.length - 1
        ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: T })} />]
        : []),
    ])}
  </TransitionSeries>
);
