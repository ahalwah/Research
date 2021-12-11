import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl"; // for tfjs

function sketch(p) {
  let detector;
  let poses;
  let video;

  async function init() {
    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
      runtime: "tfjs",
      modelType: "lite", // lite -> full -> heavy
    };
    detector = await poseDetection.createDetector(model, detectorConfig);
  }

  async function videoReady() {
    console.log("video ready");
    await getPoses();
  }

  p.setup = async function () {
    p.createCanvas(640, 480);
    video = p.createCapture(p.VIDEO, videoReady);
    video.hide();
    await init();
  };

  async function getPoses() {
    // unhadled rejection (TypeError)
    try {
      poses = await detector.estimatePoses(video.elt);
    } catch (error) {
      console.log(error);
    }

    setTimeout(getPoses, 0);
  }

  p.draw = function () {
    let time;
    p.background(220);
    p.image(video, 0, 0);
    if (poses && poses.length > 0)
      for (var i = 0; i < poses[0].keypoints.length; i++) {
        time = new Date().getTime();
        let x = poses[0].keypoints[i].x;
        let y = poses[0].keypoints[i].y;
        let z = mapping(poses[0].keypoints3D[i].z, -1, 1, 0, 2);

        if (
          poses[0].keypoints[i].name === "right_wrist" &&
          poses[0].keypoints[i].score > 0.6
        ) {
          console.log(x + " " + y + " " + time);
          p.circle(x, y, 30);
        }
      }
  };

  function mapping(number, inMin, inMax, outMin, outMax) {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
export default sketch;
