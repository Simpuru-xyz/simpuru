import { Composition } from "remotion";
import { Demo, DEMO_FRAMES, FPS } from "./Demo";

export const Root = () => (
  <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={FPS} width={1920} height={1080} />
);
