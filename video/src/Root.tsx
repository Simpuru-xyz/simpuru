import { Composition } from "remotion";
import { DEMO_FRAMES, Demo, FPS } from "./Demo";
import { SLIDE_COUNT, Slides } from "./slides";
import { FILM_FRAMES, Film } from "./v3";

export const Root = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={FILM_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="Slides"
      component={Slides}
      durationInFrames={SLIDE_COUNT}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DEMO_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
