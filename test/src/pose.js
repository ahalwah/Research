import * as Pose from "@mediapipe/pose/pose"; //
import * as Camera from "@mediapipe/camera_utils/camera_utils";

function pose(p) {
  let poses;

  let video;
  let camera;
  let pose;

  function onResults(results) {
    // pose detection
    if (results.poseLandmarks) {
      poses = results.poseLandmarks;
      console.log(poses[0].z);
    }
  }

  async function videoReady() {
    console.log("video ready");
  }

  p.setup = async function () {
    pose = new Pose.Pose({
      locateFile: (file) => {
        //console.log(file);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    p.createCanvas(640, 480);
    video = p.createCapture(p.VIDEO, videoReady);
    video.hide();

    pose.onResults(onResults);

    camera = new Camera.Camera(video.elt, {
      onFrame: async () => {
        await pose.send({ image: video.elt });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  };

  p.draw = async function () {
    p.image(video, 0, 0);
  };
}
export default pose;
