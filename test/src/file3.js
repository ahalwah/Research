import React, { useRef, useEffect } from "react";
import Homogenous_Matrix from "./functions/axis_angle";
import Dual_quat from "./functions/dual_quaternion";
import Translation from "./functions/dFromDual";
import { ReactP5Wrapper } from "react-p5-wrapper";
import * as math from "mathjs";
import * as ml5 from "ml5/dist/ml5";
import Helper from "./functions/helper";
import * as Holistic from "@mediapipe/holistic/holistic";
// mediapipe camrea tools
import * as Camera from "@mediapipe/camera_utils/camera_utils";
// mediapipe drawing tools
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";

export default function File3() {
  // checkbox
  let checked = false;
  const handleChange = () => {
    checked = !checked;
  };
  // Helper obj to access functions
  const help = new Helper();
  // append position array during recording
  let position = [];
  let dualPosition = [];
  let keyPosition = [];
  let previousFrameTime = 0;

  // React DOM references
  const output_canvas = useRef(null);
  const input_video = useRef(null);

  // trained model hand
  let brain;
  let poseLabel;
  let loaded = false;

  // timer
  let startTime, currentTime;
  let timer = false;
  let seconds;
  let closedCounter = 0,
    openCounter = 0;

  const onResults = (results) => {
    // Draw landmark guides
    if (results) {
      drawResults(results, new Date());
      if (results.rightHandLandmarks) {
        const hand = results.rightHandLandmarks;
        if (loaded == true && checked) {
          let inputs = [];
          for (let i = 0; i < hand.length; i++) {
            let x = hand[i].x;
            let y = hand[i].y;
            let z = hand[i].z;
            inputs.push(x);
            inputs.push(y);
            inputs.push(z);
          }
          brain.classify(inputs, gotResult);
          if (poseLabel == 1) {
            console.log("Closed");
            closedCounter++;
          }
          if (poseLabel == 2) {
            console.log("Open");
            openCounter++;
          }
        }
        if (closedCounter > 5 && timer == false) {
          // start count
          startTime = new Date();
          timer = true;
          position = [
            {
              Phand: { x: hand[0].x, y: hand[0].y, z: hand[0].z },
              PhandTip: { x: hand[12].x, y: hand[12].y, z: hand[12].z },
              PhandThumb: { x: hand[4].x, y: hand[4].y, z: hand[4].z },
              time: 0,
            },
          ];
          keyPosition = [];
          dualPosition = [];
        }
        if (timer == true) {
          // calculate time difference
          currentTime = new Date();
          let timeDiff = currentTime - startTime; //in ms
          // strip the ms
          timeDiff /= 1000;
          // get seconds
          seconds = math.round(timeDiff);
          // add (x,y,z) coordinates
          position.push({
            Phand: { x: hand[0].x, y: hand[0].y, z: hand[0].z },
            PhandTip: { x: hand[12].x, y: hand[12].y, z: hand[12].z },
            PhandThumb: { x: hand[4].x, y: hand[4].y, z: hand[4].z },
            time: seconds,
          });
        }
        if (timer == true && seconds > 0) {
          const canvasElement = output_canvas.current;
          const canvasCtx = canvasElement.getContext("2d");
          canvasCtx.save();
          canvasCtx.font = "50px Arial";
          canvasCtx.fillStyle = "yellow";
          canvasCtx.fillText(seconds, 50, 50);
          canvasCtx.restore();
        }
        if (timer == true && openCounter > 5) {
          timer = false;
          closedCounter = 0;
          openCounter = 0;
          let G1, H1;
          let frameBuffer = 0;
          const frameCount = 20; // approx 3 seconds
          // calculate key positions
          for (let i = 0; i < position.length; i++) {
            const Phand = [
              position[i].Phand.x,
              position[i].Phand.y,
              position[i].Phand.z,
            ];
            const PhandTip = [
              position[i].PhandTip.x,
              position[i].PhandTip.y,
              position[i].PhandTip.z,
            ];
            const PhandThumb = [
              position[i].PhandThumb.x,
              position[i].PhandThumb.y,
              position[i].PhandThumb.z,
            ];
            // const spatialQ = help.spatialDualQuaternion(
            //   Phand,
            //   PhandTip,
            //   PhandThumb
            // );
            const planarQ = help.planarDualQuaternion(
              Phand,
              PhandTip,
              PhandThumb
            );
            // const d = help.dFromDual(planarQ);
            // console.log("hand " + Phand + " d " + d);
            const R = 10000;
            const d_hat = help.normalize(Phand); // unit vector along translation vector d
            const d = help.mag(Phand); // magnitude of translation vector Phand (dsit from origin to hand)
            const denom = math.sqrt(4 * R ** 2 + d ** 2);
            const vector = math.multiply(d_hat, d / denom); // vector part of the quaternion
            const D = [(2 * R) / denom, vector[0], vector[1], vector[2]];
            const Ds = [D[0], -D[1], -D[2], -D[3]]; // conjugate of D
            const Q = planarQ.real;
            const G2 = help.multiply(D, Q);
            const H2 = help.multiply(Ds, Q);
            if (G1 && H1) {
              const t1 = math.subtract(G1, G2);
              const t2 = math.subtract(H1, H2);
              const T1 = math.dot(t1, t1);
              const T2 = math.dot(t2, t2);
              const delta = math.sqrt(math.add(T1, T2)); // threshold < 0.2 and dtime > 3 seconds

              if (delta < 0.2) {
                if (frameBuffer == frameCount) {
                  keyPosition.push(math.multiply(help.dFromDual(planarQ), -1));
                  frameBuffer = 0;
                } else frameBuffer++;
              } else frameBuffer = 0;
            }
            G1 = G2;
            H1 = H2;
            dualPosition.push(math.multiply(help.dFromDual(planarQ), -1));
          }
          console.log(dualPosition);
          console.log(keyPosition);
          console.log(position[position.length - 1].time);
        }
      }
    }
  };
  const drawResults = (results, time) => {
    const canvasElement = output_canvas.current;
    const canvasCtx = canvasElement.getContext("2d");
    // Calc FPS
    let FPS = math.floor(1000 / (time - previousFrameTime));
    previousFrameTime = time;

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
      results.rightHandLandmarks,
      Holistic.HAND_CONNECTIONS,
      {
        color: "#22c3e3",
        lineWidth: 5,
      }
    );
    Drawing.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
      color: "#ff0364",
      lineWidth: 2,
    });
    // Print FPS on canvas
    canvasCtx.font = "50px Arial";
    canvasCtx.fillStyle = "pink";
    canvasCtx.fillText(FPS, canvasElement.width - 100, 50);
    canvasCtx.restore();
  };

  function brainLoaded() {
    console.log("hand gesture classification ready!");
    loaded = true;
  }
  function gotResult(error, results) {
    if (results[0].confidence > 0.75) {
      poseLabel = results[0].label;
    }
  }
  useEffect(() => {
    let options = {
      inputs: 21,
      outputs: 5,
      task: "classification",
      debug: true,
    };
    brain = ml5.neuralNetwork(options);
    const modelInfo = {
      model: "model.json",
      metadata: "model_meta.json",
      weights: "model.weights.bin",
    };
    brain.load(modelInfo, brainLoaded);

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

  function sketch(p5) {
    const height = 480,
      width = 640;
    p5.setup = () => {
      p5.createCanvas(width, height);
    };
    p5.draw = () => {
      p5.clear();
      p5.background(220);
      if (keyPosition.length > 0) {
        p5.stroke("red");
        p5.strokeWeight(5);
        for (let i = 0; i < dualPosition.length; i++) {
          const point = dualPosition[i];
          let x = p5.map(point[0], 0, 1, 0, width);
          let y = p5.map(point[1], 0, 1, 0, height);
          p5.point(x, y);
        }
        p5.stroke("black");
        p5.textSize(15);
        p5.strokeWeight(1);
        p5.noFill();
        for (let i = 0; i < keyPosition.length; i++) {
          const point = keyPosition[i];
          let x = p5.map(point[0], 0, 1, 0, width);
          let y = p5.map(point[1], 0, 1, 0, height);
          p5.text(i, x, y - 10);
        }
        p5.stroke("green");
        p5.strokeWeight(10);
        for (let i = 0; i < keyPosition.length; i++) {
          const point = keyPosition[i];
          let x = p5.map(point[0], 0, 1, 0, width);
          let y = p5.map(point[1], 0, 1, 0, height);
          p5.point(x, y);
        }
      }
    };
  }
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <video ref={input_video} hidden></video>
      <canvas ref={output_canvas} width="640" height="480"></canvas>
      <Checkbox label="Start Recording" onChange={handleChange} />
      <ReactP5Wrapper sketch={sketch} />
    </div>
  );
}
const Checkbox = ({ label, value, onChange }) => {
  return (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );
};
