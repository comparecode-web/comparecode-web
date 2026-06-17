self.onmessage = async (event) => {
  const { id, original, modified } = event.data;
  try {
    if (!self.cv) {
      importScripts("/vendor/opencv.js");
      if (!self.cv.Mat) {
        await new Promise((resolve) => {
          self.cv.onRuntimeInitialized = resolve;
        });
      }
    }

    const cv = self.cv;
    const toGray = (image) => {
      const source = cv.matFromImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height));
      const gray = new cv.Mat();
      const equalized = new cv.Mat();
      cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
      cv.equalizeHist(gray, equalized);
      source.delete();
      gray.delete();
      return equalized;
    };

    const originalGray = toGray(original);
    const modifiedGray = toGray(modified);
    const originalKeypoints = new cv.KeyPointVector();
    const modifiedKeypoints = new cv.KeyPointVector();
    const originalDescriptors = new cv.Mat();
    const modifiedDescriptors = new cv.Mat();
    const matches = new cv.DMatchVectorVector();
    const orb = new cv.ORB(500, 1.2, 6, 20, 0, 2, cv.ORB_HARRIS_SCORE, 25, 16);
    const matcher = new cv.BFMatcher(cv.NORM_HAMMING, false);

    orb.detectAndCompute(originalGray, new cv.Mat(), originalKeypoints, originalDescriptors);
    orb.detectAndCompute(modifiedGray, new cv.Mat(), modifiedKeypoints, modifiedDescriptors);
    matcher.knnMatch(modifiedDescriptors, originalDescriptors, matches, 2);

    const from = [];
    const to = [];
    for (let index = 0; index < matches.size(); index++) {
      const pair = matches.get(index);
      if (pair.size() < 2) continue;
      const best = pair.get(0);
      const second = pair.get(1);
      if (best.distance >= second.distance * 0.76) continue;
      const modifiedPoint = modifiedKeypoints.get(best.queryIdx).pt;
      const originalPoint = originalKeypoints.get(best.trainIdx).pt;
      from.push(modifiedPoint.x, modifiedPoint.y);
      to.push(originalPoint.x, originalPoint.y);
    }

    if (from.length < 16) {
      throw new Error("Not enough OpenCV matches");
    }

    const fromMat = cv.matFromArray(from.length / 2, 1, cv.CV_32FC2, from);
    const toMat = cv.matFromArray(to.length / 2, 1, cv.CV_32FC2, to);
    const inliers = new cv.Mat();
    const affine = cv.estimateAffinePartial2D(fromMat, toMat, inliers, cv.RANSAC, 6, 600, 0.98, 8);
    const matrix = affine.data64F && affine.data64F.length ? Array.from(affine.data64F) : Array.from(affine.data32F || []);
    const inlierData = inliers.data || inliers.data8U || [];
    let inlierCount = 0;
    for (let index = 0; index < inlierData.length; index++) {
      if (inlierData[index]) inlierCount++;
    }

    originalGray.delete();
    modifiedGray.delete();
    originalKeypoints.delete();
    modifiedKeypoints.delete();
    originalDescriptors.delete();
    modifiedDescriptors.delete();
    matches.delete();
    orb.delete();
    matcher.delete();
    fromMat.delete();
    toMat.delete();
    inliers.delete();
    affine.delete();

    self.postMessage({ id, success: true, matrix, matches: from.length / 2, inliers: inlierCount });
  } catch (error) {
    self.postMessage({ id, success: false, error: error instanceof Error ? error.message : "OpenCV worker alignment failed" });
  }
};
