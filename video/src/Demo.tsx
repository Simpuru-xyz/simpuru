import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Agents, Close, Coworker, Hook, How, People, Problem, Protection } from "./scenes";

export const FPS = 30;
const T = 15; // cross-fade between scenes
const SCENES = [
  ["hook", Hook, 420],
  ["problem", Problem, 510],
  ["how", How, 720],
  ["people", People, 960],
  ["agents", Agents, 900],
  ["protection", Protection, 780],
  ["coworker", Coworker, 600],
  ["close", Close, 450],
] as const;

export const DEMO_FRAMES = SCENES.reduce((n, [, , d]) => n + d, 0) - T * (SCENES.length - 1);

export const Demo = () => (
  <TransitionSeries>
    {SCENES.flatMap(([name, Scene, d], i) => [
      <TransitionSeries.Sequence key={name} durationInFrames={d}>
        <Scene />
      </TransitionSeries.Sequence>,
      ...(i < SCENES.length - 1
        ? [
            <TransitionSeries.Transition
              key={`${name}-out`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: T })}
            />,
          ]
        : []),
    ])}
  </TransitionSeries>
);
