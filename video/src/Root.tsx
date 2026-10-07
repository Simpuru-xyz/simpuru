import { Composition } from "remotion";
import { FILM_FRAMES, Film } from "./film";
import { SLIDE_COUNT, Slides } from "./slides";

export const FPS = 30;

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
  </>
);
