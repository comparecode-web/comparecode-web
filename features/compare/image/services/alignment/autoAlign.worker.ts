import { registerImages, type AlignmentPixels } from "./registrationEngine";
import type { ImageAlignmentOptions } from "./types";

self.onmessage = (event: MessageEvent<{ original: AlignmentPixels; modified: AlignmentPixels; options: ImageAlignmentOptions }>) => {
  const { original, modified, options } = event.data;
  self.postMessage(registerImages(original, modified, options));
};
