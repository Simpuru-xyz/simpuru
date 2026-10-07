import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Agents, Close, Coworker, Hook, How, People, Problem, Protection } from "./scenes";

export const FPS = 30;
const T = 10; // cross-fade between scenes
const SCENES = [
  ["hook", Hook, 240],
  ["problem", Problem, 250],
  ["how", How, 340],
  ["people", People, 600],
  ["agents", Agents, 330],
  ["protection", Protection, 360],
  ["coworker", Coworker, 330],
  ["close", Close, 240],
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
