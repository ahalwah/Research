import React, { useRef, useEffect, useState } from "react";
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
  const [display, setdisplay] = useState(false);
  // checkbox recording
  let checked = false;
  // checkbox right hand
  let rhandChecked = false;
  // checkbox(cb) right upper arm
  let ruarmChecked = false;
  // interpolat motion once
  let interpolateOnce = false;
  // cb for screw motion
  let screwMotionChecked = false;
  // cb for bezier motion
  let bezierMotionChecked = false;
  // spatial motion cb
  let spatialChecked = false;
  // planar motion cb
  let planarChecked = false;

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

  const onResults = (results) => {
    // Draw landmark guides
    if (results) {
      const canvasElement = output_canvas.current;
      const canvasCtx = canvasElement.getContext("2d");
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

          if (inCircle) {
            inCircleCounter++;
          }
          // open hand
          if (poseLabel == 2) {
            openCounter++;
          }
        }
        // count down 5 seconds first
        if (inCircleCounter > 5 && timer == false && startTime == null) {
          startTime = new Date();
        }
        if (inCircleCounter > 5 && timer == false && startTime != null) {
          seconds = math.floor((new Date() - startTime) / 1000);
        }
        // intiatie recording
        if (inCircleCounter > 5 && timer == false && seconds >= 5) {
          // resets
          inCircleCounter = 0;
          openCounter = 0;
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
          // ignore last 6 positions because it takes 1 second to read open hand/stop recording
          for (let i = 0; i < position.length - 10; i++) {
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
              // check if spatial or planar motion and append chosen motion dualPosition
              if (spatialChecked) {
                const spatialQ = help.spatialDualQuaternion(
                  Phand,
                  PhandTip,
                  PhandThumb
                );
                dualPosition.push(spatialQ);
              }
              if (planarChecked) {
                const planarQ = help.planarDualQuaternion(
                  Phand,
                  PhandTip,
                  PhandThumb
                );
                dualPosition.push(planarQ);
              }
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
          // dualquat => control points in dualquat format (partition into 5 control points)
          let controlPoints = []; // a temp array
          for (
            let i = 0;
            i < dualPosition.length;
            i += math.floor(dualPosition.length / 5)
          ) {
            controlPoints.push(dualPosition[i]);
          }
          controlPoints.shift(); // delete first point b/c of duplicate
          dualPosition = controlPoints;

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

    // Print FPS on canvas
    // canvasCtx.font = "50px Arial";
    // canvasCtx.fillStyle = "pink";
    // canvasCtx.fillText(FPS, canvasElement.width - 100, 50);
    // canvasCtx.restore();

    // create circular button on canvas if recording is checked
    if (checked && timer == false) {
      canvasCtx.beginPath();
      canvasCtx.arc(100, 50, 20, 0, 2 * math.pi, false);
      canvasCtx.fillStyle = "green";
      canvasCtx.fill();
      canvasCtx.lineWidth = 5;
      canvasCtx.strokeStyle = "#003300";
      canvasCtx.stroke();
    }
    // highlight index finger
    if (checked && timer == false) {
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
      const center_x = 100,
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
    // button for exporting data as csv
    let exportButton;
    // checkbox for spatial capture
    let spatialMotionCheckBox;
    // checkbox for planar capture
    let planarMotionCheckBox;
    // checkbox for screw curve
    let screwMotionCheckBox;
    // checkbox for bezier
    let bezierMotionCheckbox;
    p5.setup = () => {
      p5.createCanvas(width, height);

      // export button
      exportButton = p5.createButton("Export to CSV");
      exportButton.position(250, 520);
      exportButton.mousePressed(Export);

      // recording
      startRecording = p5.createCheckbox("Allow Recording", false);
      startRecording.position(20, 520);
      // motion capture

      planarMotionCheckBox = p5.createCheckbox("Planar Motion", false);
      planarMotionCheckBox.position(20, 560);
      spatialMotionCheckBox = p5.createCheckbox("Spatial Motion", false);
      spatialMotionCheckBox.position(20, 580);

      // right hand tracking
      rhandCheckBox = p5.createCheckbox("Right Hand", false);
      rhandCheckBox.position(20, 600);

      // type of motion
      screwMotionCheckBox = p5.createCheckbox("Screw", false);
      screwMotionCheckBox.position(20, 640);
      screwMotionCheckBox.changed(interpOnce);

      bezierMotionCheckbox = p5.createCheckbox("Rational Bezier", false);
      bezierMotionCheckbox.position(20, 660);
      bezierMotionCheckbox.changed(interpOnce);
    };
    function interpOnce() {
      if (bezierMotionCheckbox.checked() || screwMotionCheckBox.checked())
        interpolateOnce = true;
    }
    p5.draw = () => {
      p5.background(220);
      // p5.textSize(20);
      // p5.text("Recording", 20, 30);
      // p5.text("Motion Capture", 20, 60);
      // p5.text("Type of Motion", 20, 120);

      checked = startRecording.checked();
      rhandChecked = rhandCheckBox.checked();
      screwMotionChecked = screwMotionCheckBox.checked();
      bezierMotionChecked = bezierMotionCheckbox.checked();
      spatialChecked = spatialMotionCheckBox.checked();
      planarChecked = planarMotionCheckBox.checked();

      if (startRecording.checked()) {
        rhandCheckBox.removeAttribute("disabled"); // enables
        if (dualPosition.length > 0 && (spatialChecked || planarChecked)) {
          exportButton.removeAttribute("disabled");
        }
      } else {
        exportButton.attribute("disabled", ""); // disables
        rhandCheckBox.attribute("disabled", "true");
      }

      // screw motion option if dualPosition array and recording stopped
      if (dualPosition.length > 0 && timer == false) {
        screwMotionCheckBox.removeAttribute("disabled");
        bezierMotionCheckbox.removeAttribute("disabled");
      } else {
        screwMotionCheckBox.attribute("disabled", "true");
        bezierMotionCheckbox.attribute("disabled", "true");
      }
    };
    function Export() {
      console.log("export to csv");
      ExportCSV(csvData, "data file");
    }
  }
  function sketch(p5) {
    const height = 480,
      width = 640;
    let myFont;
    let controlP = [],
      controlO = [];
    let interpolatedP = [],
      interpolatedO = [];
    p5.preload = () => {
      myFont = p5.loadFont(Inconsolata);
    };
    p5.setup = () => {
      p5.createCanvas(width, height, p5.WEBGL);
    };
    function drawFrame() {
      p5.strokeWeight(2.0);
      const length = 10.0;
      p5.stroke("red");
      p5.line(0.0, 0.0, 0.0, length, 0.0, 0.0); // x-axis
      p5.stroke("blue");
      p5.line(0.0, 0.0, 0.0, 0.0, length, 0.0); //y-axis
      p5.stroke("green");
      p5.line(0.0, 0.0, 0.0, 0.0, 0.0, length); //z-axis
    }
    p5.draw = () => {
      p5.clear();
      p5.background(220);
      p5.orbitControl();
      // if recording then reset positions and angles arrays
      if (timer) {
        controlP = [];
        controlO = [];
        interpolatedP = [];
        interpolatedO = [];
      }
      if (screwMotionChecked || bezierMotionChecked) {
        if (dualPosition.length > 0 && interpolateOnce) {
          // reset in case they were used
          interpolatedP = [];
          interpolatedO = [];
          interpolateOnce = false;
          for (let i = 0; i < dualPosition.length; i++) {
            // calc translation
            const pointPosition = help.dFromDual(dualPosition[i]);
            controlP.push(pointPosition);
            // calc orientation
            const pointOrientation = help.rFromDual(dualPosition[i]);
            controlO.push(pointOrientation);
          }
          let curve = [];
          // screw points
          if (screwMotionChecked) curve = help.rationalScrew(dualPosition, 0.1);
          // bezier points
          if (bezierMotionChecked)
            curve = help.rationalBezier(dualPosition, 0.05);
          for (let i = 0; i < curve.length; i++) {
            // calc translation
            const pointPosition = help.dFromDual(curve[i]);
            interpolatedP.push(pointPosition);
            // calc orientation
            const pointOrientation = help.rFromDual(curve[i]);
            interpolatedO.push(pointOrientation);
          }
        }

        // draw interpolated positions/orientations
        p5.stroke("brown");
        if (interpolatedP.length > 0) {
          for (let i = 0; i < interpolatedP.length; i++) {
            // translation
            const x = p5.map(
                interpolatedP[i][0] * -1,
                0,
                1,
                -width / 2,
                width / 2
              ),
              y = p5.map(
                interpolatedP[i][1] * -1,
                0,
                1,
                -height / 2,
                height / 2
              ),
              z = interpolatedP[i][2];

            p5.push();
            p5.translate(x, y, z);
            const matrix = interpolatedO[i];
            // rotation
            const r11 = matrix[0][0];
            const r12 = matrix[0][1];
            const r13 = matrix[0][2];
            const r21 = matrix[1][0];
            const r22 = matrix[1][1];
            const r23 = matrix[1][2];
            const r31 = matrix[2][0];
            const r32 = matrix[2][1];
            const r33 = matrix[2][2];
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
            // scale down 70%
            p5.scale(0.7);
            // draw torus
            // p5.torus(15, 7);
            p5.ellipsoid(15, 30, 15);
            // draw coordinate fram
            //drawFrame();
            p5.pop();
          }
        }

        // draw control positions/orientations on canvas
        p5.stroke("black");
        if (controlP.length > 0) {
          for (let i = 0; i < controlP.length; i++) {
            // translation
            const x = p5.map(controlP[i][0] * -1, 0, 1, -width / 2, width / 2),
              y = p5.map(controlP[i][1] * -1, 0, 1, -height / 2, height / 2),
              z = controlP[i][2];

            p5.push();
            p5.translate(x, y, z);
            const matrix = controlO[i];
            // rotation
            const r11 = matrix[0][0];
            const r12 = matrix[0][1];
            const r13 = matrix[0][2];
            const r21 = matrix[1][0];
            const r22 = matrix[1][1];
            const r23 = matrix[1][2];
            const r31 = matrix[2][0];
            const r32 = matrix[2][1];
            const r33 = matrix[2][2];
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
            // draw torus
            // p5.torus(15, 7);
            p5.ellipsoid(15, 30, 15);
            // draw coordinate fram
            drawFrame();
            p5.pop();
          }
        }
      }
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
