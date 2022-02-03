import React, { useRef, useEffect } from "react";
import "./index.css";
// mediapipe holisitc model
import * as Holistic from "@mediapipe/holistic/holistic";
// mediapipe camrea tools
import * as Camera from "@mediapipe/camera_utils/camera_utils";
// mediapipe drawing tools
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";
// kalidokit solver
import * as Kalidokit from "kalidokit";
// Basic Three.js
import * as THREE from "three";
// GLTF Loader for Three.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// Orbit Controls for Three.js
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
// VRM Loader for Three.js
import * as VRM from "@pixiv/three-vrm/lib/three-vrm";

export default function File() {
  // React DOM references
  const output_canvas = useRef(null);
  const input_video = useRef(null);

  const onResults = (results) => {
    // Draw landmark guides
    drawResults(results);
    // Animate model
    // animateVRM(currentVrm, results);
  };
  const drawResults = (results) => {
    const canvasElement = output_canvas.current;
    const canvasCtx = canvasElement.getContext("2d");
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
    Drawing.drawConnectors(
      canvasCtx,
      results.poseLandmarks,
      Holistic.POSE_CONNECTIONS,
      {
        color: "#00FF00",
        lineWidth: 4,
      }
    );
    Drawing.drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#FF0000",
      lineWidth: 2,
    });
    Drawing.drawConnectors(
      canvasCtx,
      results.faceLandmarks,
      Holistic.FACEMESH_TESSELATION,
      {
        color: "#C0C0C070",
        lineWidth: 1,
      }
    );
    Drawing.drawConnectors(
      canvasCtx,
      results.leftHandLandmarks,
      Holistic.HAND_CONNECTIONS,
      {
        color: "#CC0000",
        lineWidth: 5,
      }
    );
    Drawing.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
      color: "#00FF00",
      lineWidth: 2,
    });
    Drawing.drawConnectors(
      canvasCtx,
      results.rightHandLandmarks,
      Holistic.HAND_CONNECTIONS,
      {
        color: "#00CC00",
        lineWidth: 5,
      }
    );
    Drawing.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#FF0000",
      lineWidth: 2,
    });
    canvasCtx.restore();
  };

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
      <video ref={input_video} autoplay muted playsinline></video>
      <canvas ref={output_canvas} width="640" height="480"></canvas>
    </div>
  );
}
