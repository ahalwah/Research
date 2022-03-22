import React, { useRef, useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { ReactP5Wrapper } from "react-p5-wrapper";
import * as math from "mathjs";
import * as ml5 from "ml5/dist/ml5";
import Helper from "./functions/helper";
import ExportCSV from "./functions/exportToCSV";
import * as Holistic from "@mediapipe/holistic/holistic";
// mediapipe camrea tools
import * as Camera from "@mediapipe/camera_utils/camera_utils";
// mediapipe drawing tools
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";
import Inconsolata from "./font/Inconsolata-Black.otf";

export default function File3() {
  // checkbox recording
  let checked = false;
  // checkbox right hand
  let rhandChecked = false;
  // checkbox right upper arm
  let ruarmChecked = false;

  // Helper obj to access functions
  const help = new Helper();
  // append position array during recording
  let position = [];
  let dualPosition = [];
  let csvData = [];
  let previousFrameTime = 0;

  // React DOM references
  const output_canvas = useRef(null);
  const input_video = useRef(null);

  // trained model hand
  let brain;
  let poseLabel;
  let loaded = false;

  // timer
  let startTime = null,
    currentTime;
  let timer = false;
  let seconds;
  let inCircleCounter = 0,
    openCounter = 0;
  // is index pointer in circle
  let inCircle = false;

  let orientation, pos;

  const onResults = (results) => {
    // Draw landmark guides
    if (results) {
      const canvasElement = output_canvas.current;
      const canvasCtx = canvasElement.getContext("2d");
      drawResults(results, new Date());
      if (results.poseLandmarks) {
        const J1 = results.poseLandmarks[12],
          J2 = results.poseLandmarks[14];
        const P2 = [J1.x, J1.y, 0],
          P1 = [J2.x, J2.y, 0];
        const dualQuat = help.dualQuaternion(P1, P2);
        // console.log(dualQuat);
        orientation = help.rFromDual(dualQuat);
        pos = help.dFromDual(dualQuat);
      }
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

          if (inCircle) {
            // console.log("in circle");
            inCircleCounter++;
          }
          // open hand
          if (poseLabel == 2) {
            //console.log("Open");
            openCounter++;
          }
        }
        // count down 5 seconds first
        if (inCircleCounter > 5 && timer == false && startTime == null) {
          console.log("true");
          startTime = new Date();
        }
        if (inCircleCounter > 5 && timer == false && startTime != null) {
          seconds = math.floor((new Date() - startTime) / 1000);
        }
        // intiatie recording
        if (inCircleCounter > 5 && timer == false && seconds >= 5) {
          // start count
          startTime = new Date();
          timer = true;
          if (rhandChecked)
            position = [
              {
                Phand: { x: hand[0].x, y: hand[0].y, z: hand[0].z },
                PhandTip: { x: hand[12].x, y: hand[12].y, z: hand[12].z },
                PhandThumb: { x: hand[4].x, y: hand[4].y, z: hand[4].z },
                time: 0,
              },
            ];
          if (ruarmChecked) {
            const J1 = results.poseLandmarks[11],
              J2 = results.poseLandmarks[13];
            position = [
              {
                J1: { x: J1.x, y: J1.y, z: J1.z },
                J2: { x: J2.x, y: J2.y, z: J2.z },
              },
            ];
          }
          dualPosition = [];
        }

        // do the recording
        if (timer == true) {
          // calculate time difference
          currentTime = new Date();
          let timeDiff = currentTime - startTime; //in ms
          // strip the ms
          timeDiff /= 1000;
          // get seconds
          seconds = math.round(timeDiff);
          // add (x,y,z) coordinates
          if (rhandChecked)
            position.push({
              Phand: { x: hand[0].x, y: hand[0].y, z: hand[0].z },
              PhandTip: { x: hand[12].x, y: hand[12].y, z: hand[12].z },
              PhandThumb: { x: hand[4].x, y: hand[4].y, z: hand[4].z },
              time: seconds,
            });
          if (ruarmChecked) {
            const J1 = results.poseLandmarks[11],
              J2 = results.poseLandmarks[13];
            position.push({
              J1: { x: J1.x, y: J1.y, z: J1.z },
              J2: { x: J2.x, y: J2.y, z: J2.z },
            });
          }
        }
        // write count down seconds on the canvas
        if (timer == false && startTime != null) {
          // canvasCtx.save();
          canvasCtx.font = "200px Arial";
          canvasCtx.fillStyle = "red";
          canvasCtx.fillText(
            5 - seconds,
            canvasElement.width / 2,
            canvasElement.height / 2
          );
          // canvasCtx.restore();
        }
        // write seconds on the canvas
        if (timer == true && seconds > 0) {
          canvasCtx.font = "50px Arial";
          canvasCtx.fillStyle = "red";
          canvasCtx.fillText(seconds, canvasElement.width - 50, 50);
        }
        // end recording
        if (timer == true && openCounter > 5) {
          // reset variables
          timer = false;
          startTime = null;
          inCircleCounter = 0;
          openCounter = 0;

          // iterate through positions and calculate dual quaternion
          console.log(position);
          for (let i = 0; i < position.length; i++) {
            if (rhandChecked) {
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
              dualPosition.push(planarQ);
            }
            if (ruarmChecked) {
              const J1 = position[i].J1,
                J2 = position[i].J2;
              const P1 = [J2.x, J2.y, 0],
                P2 = [J1.x, J1.y, 0];
              const dualQuat = help.dualQuaternion(P1, P2);
              dualPosition.push(dualQuat);
            }
          }
          console.log(dualPosition);
          // iterate through dual quaternion and fill csv data to test functionality
          for (let i = 0; i < dualPosition.length; i++) {
            const real = dualPosition[i].real,
              dual = dualPosition[i].dual;
            csvData.push({
              Q1: real[0],
              Q2: real[1],
              Q3: real[2],
              Q4: real[3],
              Q01: dual[0],
              Q02: dual[1],
              Q03: dual[2],
              Q03: dual[3],
            });
          }
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
    // canvasCtx.font = "50px Arial";
    // canvasCtx.fillStyle = "pink";
    // canvasCtx.fillText(FPS, canvasElement.width - 100, 50);
    // canvasCtx.restore();

    // create circular button on canvas if recording is checked
    if (checked && timer == false) {
      canvasCtx.beginPath();
      canvasCtx.arc(50, 50, 20, 0, 2 * math.pi, false);
      canvasCtx.fillStyle = "green";
      canvasCtx.fill();
      canvasCtx.lineWidth = 5;
      canvasCtx.strokeStyle = "#003300";
      canvasCtx.stroke();
    }
    // highlight index finger
    if (results.rightHandLandmarks) {
      canvasCtx.beginPath();
      canvasCtx.arc(
        results.rightHandLandmarks[8].x * canvasElement.width,
        results.rightHandLandmarks[8].y * canvasElement.height,
        10,
        0,
        2 * math.pi,
        false
      );
      canvasCtx.fillStyle = "blue";
      canvasCtx.fill();
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = "black";
      canvasCtx.stroke();

      // check if index pointer is on button
      const x = results.rightHandLandmarks[8].x * canvasElement.width,
        y = results.rightHandLandmarks[8].y * canvasElement.height;
      const center_x = 50,
        center_y = 50,
        radius = 20;
      inCircle = (x - center_x) ** 2 + (y - center_y) ** 2 <= radius ** 2;
    }
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

  function userInterface(p5) {
    const height = 480,
      width = 640;
    // checkbox for recording
    let startRecording;
    // checkbox right hand (limb)
    let rhandCheckBox;
    let exportButton;
    p5.setup = () => {
      p5.createCanvas(width, height);

      startRecording = p5.createCheckbox("Start Recording", false);
      startRecording.position(20, 500);

      rhandCheckBox = p5.createCheckbox("Right Hand", false);
      rhandCheckBox.position(20, 520);
    };
    p5.draw = () => {
      p5.background(220);

      checked = startRecording.checked();
      rhandChecked = rhandCheckBox.checked();

      if (startRecording.checked()) rhandCheckBox.removeAttribute("disabled");
      else rhandCheckBox.attribute("disabled", "true");
    };
  }
  function sketch(p5) {
    const height = 480,
      width = 640;
    let myFont;
    p5.preload = () => {
      myFont = p5.loadFont(Inconsolata);
    };
    p5.setup = () => {
      p5.createCanvas(width, height, p5.WEBGL);
    };
    p5.draw = () => {
      p5.clear();
      p5.background(220);
      if (false) {
        // pos
        const x = p5.map(pos[0] * -1, 0, 1, -width / 2, width / 2),
          y = p5.map(pos[1] * -1, 0, 1, -height / 2, height / 2),
          z = pos[2];
        console.log(x + " " + y);
        p5.translate(x, y, 0);
      }
      if (false) {
        // orientation
        const r11 = orientation[0][0];
        const r12 = orientation[0][1];
        const r13 = orientation[0][2];
        const r21 = orientation[1][0];
        const r22 = orientation[1][1];
        const r23 = orientation[1][2];
        const r31 = orientation[2][0];
        const r32 = orientation[2][1];
        const r33 = orientation[2][2];
        p5.applyMatrix(
          r11,
          r12,
          r13,
          0,
          r21,
          r22,
          r23,
          0,
          r31,
          r32,
          r33,
          0,
          0,
          0,
          0,
          1
        );
      }
      p5.translate(0, 40, 0);
      p5.ellipsoid(30, 80, 80);
    };
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <video ref={input_video} hidden></video>
        <canvas ref={output_canvas} width="640" height="480"></canvas>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ReactP5Wrapper sketch={userInterface} />
        <ReactP5Wrapper sketch={sketch} />
      </div>
    </div>
  );
}
const Checkbox = ({ label, value, onChange, disabled }) => {
  return (
    <label>
      <input
        type="checkbox"
        checked={value}
        onChange={onChange}
        disabled={disabled}
      />
      {label}
    </label>
  );
};
