import { Composition } from "remotion";
import { DEMO_FRAMES, Demo, FPS } from "./Demo";

export const Root = () => (
  <Composition
    id="Demo"
    component={Demo}
    durationInFrames={DEMO_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
