import React, { useRef, useEffect } from "react";
import "./index.css";
import { ReactP5Wrapper } from "react-p5-wrapper";
import Inconsolata from "./font/Inconsolata-Black.otf";
import * as Pose from "@mediapipe/pose/pose";
import * as Holistic from "@mediapipe/holistic/holistic";
import * as Camera from "@mediapipe/camera_utils/camera_utils";
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";
import * as Kalidokit from "kalidokit";

// Skeleton imports
import headURL from "./assets/head.obj";

export default function App2() {
  const input_video = useRef(null);
  const output_canvas = useRef(null);
  let facelm;
  let faceRig;

  function sketch(p5) {
    let myFont;
    let head;

    p5.preload = () => {
      myFont = p5.loadFont(Inconsolata);
      head = p5.loadModel(headURL, true);
    };
    p5.setup = () => {
      p5.createCanvas(640, 480, p5.WEBGL);
    };
    p5.draw = () => {
      p5.background(220);

      // init
      p5.normalMaterial();
      p5.rotateX(p5.PI / 2);
      p5.rotateZ(p5.PI);

      if (facelm) {
        faceRig = Kalidokit.Face.solve(facelm, {
          runtime: "mediapipe",
          video: input_video.current,
        });
        console.log(faceRig.head);
        p5.rotateX(-faceRig.head.x); // good
        p5.rotateZ(faceRig.head.y); // side to side
        p5.rotateY(faceRig.head.z); // tilt
      }

      p5.model(head);
    };
  }
  function onResults(results) {
    const canvasElement = output_canvas.current;
    const canvasCtx = canvasElement.getContext("2d");
    if (results) {
      // do something with prediction results
      // landmark names may change depending on TFJS/Mediapipe model version
      facelm = results.faceLandmarks;
      // let poselm = results.poseLandmarks;
      // let poselm3D = results.ea;
      // let rightHandlm = results.rightHandLandmarks;
      // let leftHandlm = results.leftHandLandmarks;

      // let poseRig = Kalidokit.Pose.solve(poselm3D, poselm, {
      //   runtime: "mediapipe",
      //   video: HTMLVideoElement,
      // });
      // let rightHandRig = Kalidokit.Hand.solve(rightHandlm, "Right");
      // let leftHandRig = Kalidokit.Hand.solve(leftHandlm, "Left");
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = "source-in";
    canvasCtx.fillStyle = "#00FF00";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = "destination-atop";
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    canvasCtx.globalCompositeOperation = "source-over";
    // Drawing.drawConnectors(
    //   canvasCtx,
    //   results.poseLandmarks,
    //   Holistic.POSE_CONNECTIONS,
    //   {
    //     color: "#00FF00",
    //     lineWidth: 4,
    //   }
    // );
    // Drawing.drawLandmarks(canvasCtx, results.poseLandmarks, {
    //   color: "#FF0000",
    //   lineWidth: 2,
    // });
    Drawing.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      Holistic.FACEMESH_TESSELATION,
      {
        color: "#C0C0C070",
        lineWidth: 1,
      }
    );
    // Drawing.drawConnectors(
    //   canvasCtx,
    //   results.leftHandLandmarks,
    //   Holistic.HAND_CONNECTIONS,
    //   {
    //     color: "#CC0000",
    //     lineWidth: 5,
    //   }
    // );
    // Drawing.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
    //   color: "#00FF00",
    //   lineWidth: 2,
    // });
    // Drawing.drawConnectors(
    //   canvasCtx,
    //   results.rightHandLandmarks,
    //   Holistic.HAND_CONNECTIONS,
    //   {
    //     color: "#00CC00",
    //     lineWidth: 5,
    //   }
    // );
    // Drawing.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
    //   color: "#FF0000",
    //   lineWidth: 2,
    // });
    canvasCtx.restore();
  }

  useEffect(() => {
    const holistic = new Holistic.Holistic({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      },
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults(onResults);

    const camera = new Camera.Camera(input_video.current, {
      onFrame: async () => {
        await holistic.send({ image: input_video.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);

  return (
    <div className="container">
      <video ref={input_video} hidden></video>
      <ReactP5Wrapper sketch={sketch} />
      <canvas ref={output_canvas} width="640" height="480"></canvas>
    </div>
  );
}
