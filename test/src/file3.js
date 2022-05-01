import React, { useRef, useEffect, useState } from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import * as math from "mathjs";
import teapotURL from "./assets/teapot.obj";
import greenColor from "./assets/green.png";
import Helper from "./functions/helper";
import ExportCSV from "./functions/exportToCSV";
import * as Holistic from "@mediapipe/holistic/holistic";
// mediapipe camrea tools
import * as Camera from "@mediapipe/camera_utils/camera_utils";
// mediapipe drawing tools
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";
import Inconsolata from "./font/Inconsolata-Black.otf";

export default function File3() {
  // interpolat motion once
  let interpolateOnce = false;
  // Type of Motion
  // cb for screw motion
  let screwMotionChecked = false;
  // cb for bezier motion
  let bezierMotionChecked = false;
  // cb for b-spline motion
  let bSplineMotionChecked = false;
  let degree;

  // Type of Capture
  // checkbox recording
  let checked = false;
  // spatial motion cb
  let spatialChecked = false;
  // planar motion cb
  let planarChecked = false;
  // continuous motion cb
  let contMotionChecked = false;
  // key position cb
  let keyPosChecked = false;
  let keyPositionsSelected = false;
  // limb motion cb
  let limbMotionChecked = false;
  let limbSelected = {
    spine: {
      selected: false,
      index1: [11, 12],
      index2: [23, 24],
      color: [128, 0, 0],
    },
    ruarm: { selected: false, index1: 12, index2: 14, color: [0, 0, 255] },
    rlarm: { selected: false, index1: 14, index2: 16, color: [0, 255, 255] },
    luarm: { selected: false, index1: 11, index2: 13, color: [139, 0, 139] },
    llarm: { selected: false, index1: 13, index2: 15, color: [255, 0, 255] },
    ruleg: { selected: false, index1: 24, index2: 26, color: [139, 69, 19] },
    rlleg: { selected: false, index1: 26, index2: 28, color: [244, 164, 96] },
    luleg: { selected: false, index1: 23, index2: 25, color: [255, 69, 0] },
    llleg: { selected: false, index1: 25, index2: 27, color: [240, 230, 140] },
  };
  // joint motion cb
  let jointMotionChecked = false;
  let jointSelected = {
    rshoulder: { selected: false, index: 12, color: [255, 140, 0] },
    relbow: { selected: false, index: 14, color: [128, 128, 0] },
    rwrist: { selected: false, index: 16, color: [255, 20, 147] },
    lshoulder: { selected: false, index: 11, color: [85, 107, 47] },
    lelbow: { selected: false, index: 13, color: [0, 255, 0] },
    lwrist: { selected: false, index: 15, color: [0, 250, 154] },
    rhip: { selected: false, index: 24, color: [0, 0, 255] },
    rknee: { selected: false, index: 26, color: [138, 43, 226] },
    rankle: { selected: false, index: 28, color: [106, 90, 205] },
    lhip: { selected: false, index: 23, color: [255, 0, 0] },
    lknee: { selected: false, index: 25, color: [244, 164, 96] },
    lankle: { selected: false, index: 27, color: [112, 128, 144] },
  };

  // Motion Properties
  let cMotionChecked = false;
  let kMotionChecked = false;
  // density and size
  let densityIncrement = 1,
    size;
  let objectChecked, whiteBGChecked, coordFrameChecked, trajectoryChecked;
  // Helper obj to access functions
  const help = new Helper();
  // append position array during recording
  let position = [],
    alternate = [];
  let trial = [];
  let poses;
  let dualPosition = [];
  let keyPositions = [];
  let csvData = [];
  let previousFrameTime = 0;

  // key position algorithm variables
  let dualPositionTemp = [];
  const frameCount = 21; // approx 3 seconds
  let frameBuffer = 0;

  // React DOM references
  const output_canvas = useRef(null);
  const input_video = useRef(null);

  // timer
  let startTime = null,
    currentTime;
  let timer = false;
  let seconds;
  let inCircleCounter = 0,
    inCircleCounter2 = 0;
  // is index pointer in circle
  let inCircle = false; // to start recording
  let inCircle2 = false; // to end recording

  const onResults = (results) => {
    const canvasElement = output_canvas.current;
    const canvasCtx = canvasElement.getContext("2d");

    // variables for defining position of recording buttons
    const center_x = 60,
      center_y = 50,
      radius = 30;

    drawResults(results, new Date());
    // write count down seconds on the canvas
    if (timer == false && startTime != null) {
      canvasCtx.font = "200px Arial";
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(
        5 - seconds,
        canvasElement.width / 2,
        canvasElement.height / 2
      );
    }
    // write seconds on the canvas
    if (timer == true && seconds > 0) {
      canvasCtx.font = "50px Arial";
      canvasCtx.fillStyle = "red";
      canvasCtx.fillText(seconds, canvasElement.width - 80, 50);
    }

    // create circular button on canvas if recording is checked
    if (checked && timer == false) {
      canvasCtx.beginPath();
      canvasCtx.arc(center_x, center_y, radius, 0, 2 * math.pi, false);
      canvasCtx.fillStyle = "green";
      canvasCtx.fill();
      canvasCtx.lineWidth = 5;
      canvasCtx.strokeStyle = "#003300";
      canvasCtx.stroke();
    }
    // create circular button on canvas for ending recording
    if (checked && timer == true) {
      canvasCtx.beginPath();
      canvasCtx.arc(center_x, center_y, radius, 0, 2 * math.pi, false);
      canvasCtx.fillStyle = "red";
      canvasCtx.fill();
      canvasCtx.lineWidth = 5;
      canvasCtx.strokeStyle = "#300000";
      canvasCtx.stroke();
    }
    // check if index pointer is on button
    if (checked && results.rightHandLandmarks) {
      const x = results.rightHandLandmarks[8].x * canvasElement.width,
        y = results.rightHandLandmarks[8].y * canvasElement.height;
      if (timer == false)
        inCircle = (x - center_x) ** 2 + (y - center_y) ** 2 <= radius ** 2;
      if (timer == true)
        inCircle2 = (x - center_x) ** 2 + (y - center_y) ** 2 <= radius ** 2;
    }
    // Draw landmark guides
    if (results) {
      if (results.rightHandLandmarks && results.poseLandmarks) {
        const hand = results.rightHandLandmarks;
        let z = results.poseLandmarks[16].z; //wrist

        if (checked) {
          // to start recording
          if (inCircle) {
            inCircleCounter++;
          }
          // to stop recording
          if (inCircle2) {
            inCircleCounter2++;
          }
        }
        // count down 5 seconds first
        if (inCircleCounter > 10 && timer == false && startTime == null) {
          startTime = new Date();
        }
        if (inCircleCounter > 10 && timer == false && startTime != null) {
          seconds = math.floor((new Date() - startTime) / 1000);
        }
        // intiatie recording
        if (inCircleCounter > 10 && timer == false && seconds >= 5) {
          // resets
          inCircleCounter = 0;
          inCircleCounter2 = 0;
          dualPosition = [];
          keyPositions = [];
          dualPositionTemp = [];
          frameBuffer = 0;
          // start count
          startTime = new Date();
          timer = true;

          position = [];
          alternate = [];
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
          if (contMotionChecked || keyPosChecked) {
            // check if spatial or planar motion and append chosen motion dualPosition
            let dualQ;
            if (spatialChecked) {
              const Phand = [hand[9].x, hand[9].y, hand[9].z + z];
              const PhandTip = [hand[10].x, hand[10].y, hand[10].z + z];
              const PhandThumb = [hand[5].x, hand[5].y, hand[5].z + z];

              dualQ = help.spatialDualQuaternion(Phand, PhandTip, PhandThumb);
              position.push({
                Phand: {
                  x: 640 * Phand[0],
                  y: 480 * Phand[1],
                  z: 640 * Phand[2],
                },
                PhandTip: {
                  x: 640 * PhandTip[0],
                  y: 480 * PhandTip[1],
                  z: 640 * PhandTip[2],
                },
                PhandThumb: {
                  x: 640 * PhandThumb[0],
                  y: 480 * PhandThumb[1],
                  z: 640 * PhandThumb[2],
                },
                time: seconds,
              });
            }
            if (planarChecked) {
              const Phand = [hand[0].x, hand[0].y, hand[0].z + z];
              const PhandTip = [hand[9].x, hand[9].y, hand[9].z + z];
              dualQ = help.planarDualQuaternion(Phand, PhandTip);
              position.push({
                Phand: { x: 640 * Phand[0], y: 480 * Phand[1], z: 0 },
                PhandTip: { x: 640 * PhandTip[0], y: 480 * PhandTip[1], z: 0 },
                time: seconds,
              });
            }
            if (contMotionChecked) dualPosition.push(dualQ);
            else {
              dualPositionTemp.push(dualQ);
              if (dualPositionTemp.length > 1) {
                // key position algorithm
                const i = dualPositionTemp.length - 1; // last position in array
                const BiQuat1 = help.calcBiQuaternions(
                  dualPositionTemp[i - 1],
                  position[i - 1]
                );
                const BiQuat2 = help.calcBiQuaternions(
                  dualPositionTemp[i],
                  position[i]
                );
                const G1 = BiQuat1.G,
                  H1 = BiQuat1.H;
                const G2 = BiQuat2.G,
                  H2 = BiQuat2.H;
                // calc delta
                const t1 = math.subtract(G1, G2);
                const t2 = math.subtract(H1, H2);
                const T1 = math.dot(t1, t1);
                const T2 = math.dot(t2, t2);
                const delta = math.sqrt(math.add(T1, T2));
                // condition
                if (delta < 0.3) {
                  if (frameBuffer == frameCount) {
                    keyPositions.push(dualQ);
                    frameBuffer = 0;
                  } else frameBuffer++;
                } else frameBuffer = 0;
              }
            }
          }

          if (jointMotionChecked) {
            let temp = []; // what to track using index and color
            for (const [jointName, jointInfo] of Object.entries(
              jointSelected
            )) {
              let joint = jointInfo;
              if (joint.selected) {
                let i = joint.index;
                let x = results.poseLandmarks[i].x;
                let y = results.poseLandmarks[i].y;
                let z = results.poseLandmarks[i].z * -1;

                if (planarChecked)
                  temp.push({ position: [x, y, 0], color: joint.color });
                if (spatialChecked)
                  temp.push({ position: [x, y, z], color: joint.color });
              }
            }
            position.push({ joints: temp, time: seconds });
          }

          if (limbMotionChecked) {
            let temp = []; // what to track using index and color
            for (const [limbName, limbInfo] of Object.entries(limbSelected)) {
              let limb = limbInfo;
              let P1Planar, P2Planar, P1Spatial, P2Spatial;
              if (limb.selected) {
                if (Array.isArray(limb.index1)) {
                  let point1 = help.midpoint(
                    results.poseLandmarks[limb.index1[0]],
                    results.poseLandmarks[limb.index1[1]]
                  );
                  let point2 = help.midpoint(
                    results.poseLandmarks[limb.index2[0]],
                    results.poseLandmarks[limb.index2[1]]
                  );
                  P1Planar = [point1.x, point1.y, 0]; // top

                  P2Planar = [point2.x, point2.y, 0]; // bottom

                  P1Spatial = [point1.x, point1.y, point1.z];
                  P2Spatial = [point2.x, point2.y, point2.z];
                } else {
                  J1I = limb.index1;
                  J2I = limb.index2;
                  P1Planar = [
                    results.poseLandmarks[J1I].x,
                    results.poseLandmarks[J1I].y,
                    0,
                  ]; // top

                  P2Planar = [
                    results.poseLandmarks[J2I].x,
                    results.poseLandmarks[J2I].y,
                    0,
                  ]; // bottom

                  P1Spatial = [
                    results.poseLandmarks[J1I].x,
                    results.poseLandmarks[J1I].y,
                    results.poseLandmarks[J1I].z,
                  ];
                  P2Spatial = [
                    results.poseLandmarks[J2I].x,
                    results.poseLandmarks[J2I].y,
                    results.poseLandmarks[J2I].z,
                  ];
                }

                let planarDual = help.dualQuaternion(P2Planar, P1Planar); // child(bottom), parent(top)
                let spatialDual = help.dualQuaternion(P2Spatial, P1Spatial);

                if (planarChecked)
                  temp.push({ dualQuaternion: planarDual, color: limb.color });
                if (spatialChecked)
                  temp.push({ dualQuaternion: spatialDual, color: limb.color });
              }
            }
            position.push({ limbs: temp, time: seconds });
          }
        }

        // end recording
        if (timer == true && inCircleCounter2 > 5) {
          // reset variables
          timer = false;
          startTime = null;
          inCircleCounter = 0;
          inCircleCounter2 = 0;

          // if it was key position capture then prepare to fill b-spline degree selector
          if (keyPosChecked) keyPositionsSelected = true;

          // remove last 5 elements to compensate for time to stop
          for (let i = 0; i < 5; i++) {
            dualPosition.pop();
            position.pop();
          }

          // z coordinate correction for display
          if (spatialChecked && contMotionChecked) {
            alternate = [];
            let hand = position.map((pos) => pos.Phand.z);
            let absMin = math.min(hand);
            let absMax = math.max(hand);
            // for (let i = 0; i < position.length; i++) {
            //   alternate.push(
            //     help.map(
            //       position[i].Phand.z,
            //       absMax,
            //       absMin,
            //       0,
            //       absMax - absMin
            //     )
            //   );
            // }
          }

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

    if (results.poseLandmarks) poses = results.poseLandmarks;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
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

  function userInterface(p5) {
    const height = 480,
      width = 640;
    // Type of Capture check boxes
    let contMotionCheckBox;
    let keyPositionCheckBox;
    let limbMotionCheckbox;
    let jointMotionCheckbox;
    let startRecording;
    let spatialMotionCheckBox;
    let planarMotionCheckBox;

    // Type of Motion check boxes
    let screwMotionCheckBox;
    let bezierMotionCheckbox;
    let splineMotionCheckbox;
    let pSelector,
      selection = [];
    let splineInterpCheckbox;

    // Motion properties
    let cMotionCheckBox;
    let kMotionCheckBox;
    let trajectoryCheckBox;
    let coordFrameCheckBox;
    let objectCheckBox;
    let whiteBGCheckBox;

    // density and object size
    let densitySlider;
    let sizeSlider;

    // button for exporting data as csv
    let exportButton;

    p5.setup = () => {
      p5.createCanvas(width, height);
      p5.textSize(15);
      p5.textStyle(p5.BOLD);
      // export button
      // exportButton = p5.createButton("Export to CSV");
      //exportButton.position(400, 520);
      // exportButton.mousePressed(Export);

      // type of capture
      contMotionCheckBox = p5.createCheckbox(
        " Continuous Motion Capture",
        false
      );
      contMotionCheckBox.position(20, 50);
      keyPositionCheckBox = p5.createCheckbox(" Key Position Capture", false);
      keyPositionCheckBox.position(20, 80);
      limbMotionCheckbox = p5.createCheckbox(" Limb Motion Capture", false);
      limbMotionCheckbox.position(20, 110);
      jointMotionCheckbox = p5.createCheckbox(" Joint Motion Capture", false);
      jointMotionCheckbox.position(20, 140);
      planarMotionCheckBox = p5.createCheckbox(" Planar", false);
      planarMotionCheckBox.position(230, 50);
      spatialMotionCheckBox = p5.createCheckbox(" Spatial", false);
      spatialMotionCheckBox.position(230, 80);
      // recording
      startRecording = p5.createCheckbox("Start Recording", false);
      startRecording.position(20, 170);

      // motion properties
      cMotionCheckBox = p5.createCheckbox(" Continuous Motion", false);
      cMotionCheckBox.position(350, 50);
      kMotionCheckBox = p5.createCheckbox(" Key Positions", false);
      kMotionCheckBox.position(350, 80);
      trajectoryCheckBox = p5.createCheckbox(" Trajectory", false);
      trajectoryCheckBox.position(350, 110);
      coordFrameCheckBox = p5.createCheckbox(" Coordinate Frames", false);
      coordFrameCheckBox.position(350, 140);
      objectCheckBox = p5.createCheckbox(" Object", false);
      objectCheckBox.position(350, 170);
      whiteBGCheckBox = p5.createCheckbox(" White Background", false);
      whiteBGCheckBox.position(350, 200);

      // Type Of Motion
      screwMotionCheckBox = p5.createCheckbox(" Screw", false);
      screwMotionCheckBox.position(20, 260);
      screwMotionCheckBox.changed(interpOnce);
      bezierMotionCheckbox = p5.createCheckbox(" Bezier", false);
      bezierMotionCheckbox.position(20, 290);
      bezierMotionCheckbox.changed(interpOnce);
      splineMotionCheckbox = p5.createCheckbox(
        " B-Spline Approximation",
        false
      );
      splineMotionCheckbox.position(20, 320);
      splineMotionCheckbox.changed(interpOnce);
      pSelector = p5.createSelect().id("degree");
      pSelector.position(220, 320);
      pSelector.changed(interpOnce);
      splineInterpCheckbox = p5.createCheckbox(
        " B-Spline Interpolation",
        false
      );
      splineInterpCheckbox.position(20, 350);

      // density and object size
      densitySlider = p5.createSlider(1, 100, 100, 1);
      densitySlider.position(350, 310);
      densitySlider.style("width", "150px");
      sizeSlider = p5.createSlider(1, 100, 50, 1);
      sizeSlider.position(350, 360);
      sizeSlider.style("width", "150px");
    };
    function interpOnce() {
      if (keyPositions.length > 0) interpolateOnce = true;
    }
    function enable(selectId, option) {
      let options = p5.select(`#${selectId}`);
      for (let i = 0; i < options.elt.length; i++) {
        if (options.elt[i].value === option) {
          options.elt[i].disabled = false;
        }
      }
    }
    p5.draw = () => {
      p5.background(220);
      p5.text("Type of Capture", 20, 30);
      p5.text("Type of Motion", 20, 240);
      p5.text("Motion Properties", 350, 30);
      p5.text("Density", 350, 300);
      p5.text("Object Size", 350, 350);
      p5.text(sizeSlider.value().toString() + "%", 510, 375);

      if (keyPositionsSelected) {
        keyPositionsSelected = false;
        // check key positions
        kMotionCheckBox.attribute("checked", true);
        // uncheck continuous motion
        cMotionCheckBox.removeAttribute("checked");
        // adjust drop down menu
        let n = keyPositions.length;
        // if empty then fill
        if (n > 0 && selection.length == 0) {
          for (let i = keyPositions.length - 1; i >= 1; i--) {
            selection.push(i);
            pSelector.option(i);
          }
        }
        // if it needs more degrees
        if (n > 0 && selection.length > 0) {
          let max = math.max(selection);
          if (max < keyPositions.length - 1) {
            for (let i = max + 1; i <= keyPositions.length - 1; i++) {
              selection.unshift(i);
              pSelector.unshift(i);
            }
          }
          // if it should have less degrees then we disable unecessary degrees
          if (max > keyPositions.length - 1) {
            let ind = selection.indexOf(keyPositions.length);
            for (let i = ind; i < selection.length; i++) {
              pSelector.disable(selection[i].toString());
            }
          }
          // if it has right number of degree options, remove disables if exists
          if (max == keyPositions.length - 1) {
            for (let i = 0; i < selection.length; i++) {
              enable("degree", i);
            }
          }
        }
      }
      degree = parseInt(pSelector.value());
      // remaking slider per increment values
      if (
        position.length > 0 &&
        timer == false &&
        (cMotionChecked || kMotionChecked)
      ) {
        if (densitySlider.value() <= 50) {
          let maxInc = math.floor((position.length - 1) / 2);
          let minInc = 1;
          let increments = [];
          let percents = [];
          for (let i = minInc; i <= maxInc; i++) increments.push(i);
          for (let i = 0; i < increments.length; i++) {
            let num = math.floor(position.length / increments[i]);
            percents.push(math.floor(100 * (num / position.length)));
          }
          // find closest percent
          let chosenInc;
          let pdiff = 100;
          for (let i = 0; i < percents.length; i++) {
            let diff = math.abs(percents[i] - densitySlider.value());
            if (diff <= pdiff) {
              chosenInc = increments[i];
              pdiff = diff;
            }
          }
          densityIncrement = chosenInc;
          p5.text(densitySlider.value().toString() + "%", 510, 325);
        } else {
          p5.text(densitySlider.value().toString() + "%", 510, 325);
          densityIncrement = 1;
        }
      } else if (position.length > 0 && timer == false && jointMotionChecked) {
        if (densitySlider.value() <= 50) {
          let maxInc = math.floor((position.length - 1) / 2);
          let minInc = 1;
          let increments = [];
          let percents = [];
          for (let i = minInc; i <= maxInc; i++) increments.push(i);
          for (let i = 0; i < increments.length; i++) {
            let num = math.floor(position.length / increments[i]);
            percents.push(math.floor(100 * (num / position.length)));
          }
          // find closest percent
          let chosenInc;
          let pdiff = 100;
          for (let i = 0; i < percents.length; i++) {
            let diff = math.abs(percents[i] - densitySlider.value());
            if (diff <= pdiff) {
              chosenInc = increments[i];
              pdiff = diff;
            }
          }
          densityIncrement = chosenInc;
          p5.text(densitySlider.value().toString() + "%", 510, 325);
        } else {
          p5.text(densitySlider.value().toString() + "%", 510, 325);
          densityIncrement = 1;
        }
      } else {
        p5.text(densitySlider.value().toString() + "%", 510, 325);
      }
      // size
      size = sizeSlider.value();

      checked = startRecording.checked();
      spatialChecked = spatialMotionCheckBox.checked();
      planarChecked = planarMotionCheckBox.checked();
      contMotionChecked = contMotionCheckBox.checked();
      keyPosChecked = keyPositionCheckBox.checked();
      jointMotionChecked = jointMotionCheckbox.checked();
      limbMotionChecked = limbMotionCheckbox.checked();

      screwMotionChecked = screwMotionCheckBox.checked();
      bezierMotionChecked = bezierMotionCheckbox.checked();
      bSplineMotionChecked = splineMotionCheckbox.checked();

      cMotionChecked = cMotionCheckBox.checked();
      kMotionChecked = kMotionCheckBox.checked();
      objectChecked = objectCheckBox.checked();
      whiteBGChecked = whiteBGCheckBox.checked();
      coordFrameChecked = coordFrameCheckBox.checked();
      trajectoryChecked = trajectoryCheckBox.checked();

      if (contMotionChecked) {
        if (keyPositions.length < 1)
          // disable key positions
          kMotionCheckBox.attribute("disabled", true);
        // enable key positions
        else kMotionCheckBox.removeAttribute("disabled");
        // recording in progress
        if (timer) {
          cMotionCheckBox.attribute("checked", true);
          coordFrameCheckBox.attribute("checked", true);
        }
      } else {
        kMotionCheckBox.removeAttribute("disabled");
        // cMotionCheckBox.removeAttribute("checked");
      }
      if (keyPosChecked) {
        // disable continuous motion
        cMotionCheckBox.attribute("disabled", true);
        // recording in progress
        if (timer) {
          kMotionCheckBox.attribute("checked", true);
          coordFrameCheckBox.attribute("checked", true);
        }
      } else {
        cMotionCheckBox.removeAttribute("disabled");
        // kMotionCheckBox.removeAttribute("checked");
      }

      if (jointMotionChecked) {
        if (timer) {
          objectCheckBox.attribute("checked", true);
          cMotionCheckBox.attribute("checked", true);
        }
        limbMotionCheckbox.attribute("disabled", true);
        coordFrameCheckBox.attribute("disabled", true);
      }

      if (limbMotionChecked) {
        if (timer) {
          objectCheckBox.attribute("checked", true);
          cMotionCheckBox.attribute("checked", true);
        }
        coordFrameCheckBox.attribute("disabled", true);
      }

      let typeOfMotion = [
        contMotionCheckBox,
        keyPositionCheckBox,
        limbMotionCheckbox,
        jointMotionCheckbox,
      ];
      let index,
        disable = false;
      // find index at which checkbox is checked
      for (let i = 0; i < typeOfMotion.length; i++) {
        if (typeOfMotion[i].checked()) {
          index = i;
          disable = true;
          break;
        }
        disable = false;
      }
      if (disable) {
        // disable unchecked boxes
        for (let i = 0; i < typeOfMotion.length; i++) {
          if (index != i) {
            typeOfMotion[i].attribute("disabled", "");
          }
        }
        // enable planar/spatial
        if (
          !planarMotionCheckBox.checked() &&
          !spatialMotionCheckBox.checked()
        ) {
          planarMotionCheckBox.removeAttribute("disabled");
          spatialMotionCheckBox.removeAttribute("disabled");
        } else {
          // disable unclicked checkbox
          if (planarMotionCheckBox.checked())
            spatialMotionCheckBox.attribute("disabled", "");
          if (spatialMotionCheckBox.checked())
            planarMotionCheckBox.attribute("disabled", "");
        }
        if (planarMotionCheckBox.checked())
          planarMotionCheckBox.removeAttribute("disabled");
        if (spatialMotionCheckBox.checked())
          spatialMotionCheckBox.removeAttribute("disabled");
        if (planarMotionCheckBox.checked() || spatialMotionCheckBox.checked())
          startRecording.removeAttribute("disabled");
        // enable recording checkbox
        else {
          checked = false;
          startRecording.attribute("disabled", ""); // disable recording checkbox
        }
      } else {
        // enable boxes
        for (let i = 0; i < typeOfMotion.length; i++) {
          typeOfMotion[i].removeAttribute("disabled");
        }
        // disable planar/spatial
        planarMotionCheckBox.attribute("disabled", "");
        spatialMotionCheckBox.attribute("disabled", "");
        // disable recording
        startRecording.attribute("disabled", ""); // disable recording checkbox
      }
    };
    function Export() {
      console.log("export to csv");
      ExportCSV(csvData, "data file");
    }
  }
  function sketch(p5) {
    const height = 450,
      width = 640;
    // object
    let teapot;
    let green;
    // slider to pick point from array of points
    let pointPicker;
    let pickerLabel;
    // button to delete position
    let deleteButton;
    // button to select key position
    let selectButton;
    // button to select all shown positions => key positions
    let selectShownButton;
    // selected point
    let selectedPoint;
    // motion design
    let screw = [];
    let bezier = [];
    let bSpline = [];

    p5.preload = () => {
      teapot = p5.loadModel(teapotURL, true);
      green = p5.loadImage(greenColor);
    };
    p5.setup = () => {
      p5.createCanvas(width, height, p5.WEBGL);
      // label
      pickerLabel = p5.createP("Select Position");
      pickerLabel.style("font-size", "16px");
      pickerLabel.position(10, 440);
      // slider
      pointPicker = p5.createSlider(0, 10, 0, 1);
      pointPicker.position(110, 455);
      pointPicker.style("width", "300px");
      // delete button
      deleteButton = p5.createButton("Delete");
      deleteButton.position(470, 455);
      deleteButton.mousePressed(deletePoint);
      // select button
      selectButton = p5.createButton("Select");
      selectButton.position(415, 455);
      selectButton.mousePressed(selectPoint);
      // select shown positions button
      selectShownButton = p5.createButton("Select Positions");
      selectShownButton.position(525, 455);
      selectShownButton.mousePressed(selectShown);
    };
    function selectShown() {
      keyPositionsSelected = true;
      keyPositions = [];
      if (contMotionChecked || keyPosChecked) {
        for (let i = 0; i < dualPosition.length; i += densityIncrement) {
          keyPositions.push(dualPosition[i]);
        }
      } else if (jointMotionChecked || limbMotionChecked) {
        for (let i = 0; i < position.length; i += densityIncrement) {
          keyPositions.push(position[i]);
        }
      }
      console.log("keypositions added");
      console.log(keyPositions);
    }
    function selectPoint() {
      if (keyPositions.length < 1) keyPositions.push(selectedPoint);
      else if (keyPositions.includes(selectedPoint) == false)
        keyPositions.push(selectedPoint);
    }
    function deletePoint() {
      const index = pointPicker.value();
      if (contMotionChecked || keyPosChecked) {
        // remove position from dual array
        dualPosition.splice(index, 1);
        // remove position from position array
        position.splice(index, 1);
        alternate.splice(index, 1);
      }
      if (jointMotionChecked) {
        // remove position from position array
        position.splice(index, 1);
      }
    }
    function highlightPoint() {
      p5.noStroke();
      p5.fill("yellow");
      p5.box(10);
    }
    function drawObject(objectColor) {
      p5.scale(0.4);
      p5.rotateX(p5.PI);
      p5.rotateY(p5.PI);
      if (objectColor == "normalMaterial") {
        p5.normalMaterial();
        p5.model(teapot);
      } else {
        p5.stroke(objectColor);
        p5.model(teapot);
      }
    }
    function drawFrame(length) {
      p5.strokeWeight(4.0);
      p5.stroke("blue");
      p5.line(0.0, 0.0, 0.0, length, 0.0, 0.0); // x-axis
      p5.stroke("green");
      p5.line(0.0, 0.0, 0.0, 0.0, -length, 0.0); //y-axis
      p5.stroke("purple");
      p5.line(0.0, 0.0, 0.0, 0.0, 0.0, length); //z-axis
    }
    function drawJoints(position, objectSize, resolution, isKey) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      let nJoints = position[0].joints.length;
      for (let j = 0; j < nJoints; j++) {
        p5.noFill();
        p5.beginShape();
        for (let i = 0; i < position.length; i += resolution) {
          let joint = position[i].joints[j];
          // position
          let x = p5.map(joint.position[0], 0, 1, -width / 2, width / 2);
          let y = p5.map(joint.position[1], 0, 1, -height / 2, height / 2);
          let z = (joint.position[2] * width) / 2;
          // color values
          let r = joint.color[0];
          let g = joint.color[1];
          let b = joint.color[2];
          p5.stroke(r, g, b);
          if (isKey) {
            p5.strokeWeight(10);
            p5.point(x, y, z);
          } else {
            if (objectChecked) {
              p5.strokeWeight((10 * objectSize) / 100);
              p5.point(x, y, z);
            }
            if (trajectoryChecked) {
              p5.strokeWeight(3);
              p5.vertex(x, y, z);
            }
            if (i == pointPicker.value()) {
              p5.push();
              p5.translate(x, y, z);
              highlightPoint();
              p5.pop();
              selectedPoint = position[i];
            }
          }
        }
        p5.endShape();
      }
    }
    function drawJointsMotion(position, objectSize, resolution, color) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      for (let i = 0; i < position.length; i++) {
        p5.noFill();
        p5.beginShape();
        for (let j = 0; j < position[i].length; j += resolution) {
          let x = p5.map(position[i][j][0], 0, 1, -width / 2, width / 2);
          let y = p5.map(position[i][j][1], 0, 1, -height / 2, height / 2);
          let z = (position[i][j][2] * width) / 2;

          p5.stroke(color[0], color[1], color[2]);

          if (objectChecked) {
            p5.strokeWeight((10 * objectSize) / 100);
            p5.point(x, y, z);
          }
          if (trajectoryChecked) {
            p5.strokeWeight(3);
            p5.vertex(x, y, z);
          }
        }
        p5.endShape();
      }
    }
    function drawLimbs(position, objectSize, resolution, isKey) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      let nLimbs = position[0].limbs.length;
      for (let j = 0; j < nLimbs; j++) {
        p5.noFill();
        p5.beginShape();
        for (let i = 0; i < position.length; i += resolution) {
          let limb = position[i].limbs[j];
          // position
          const pointPosition = help.dFromDual(limb.dualQuaternion);
          const x = p5.map(pointPosition[0] * -1, 0, 1, -width / 2, width / 2),
            y = p5.map(pointPosition[1] * -1, 0, 1, -height / 2, height / 2);
          let z = (pointPosition[2] * width) / 2;
          //orientation
          const matrix = help.rFromDual(limb.dualQuaternion);
          const angles = help.eulerAngles(matrix);
          // color values
          let r = limb.color[0];
          let g = limb.color[1];
          let b = limb.color[2];
          p5.stroke(r, g, b);
          if (isKey) {
            p5.push();
            p5.strokeWeight(1);
            p5.translate(x, y, z);
            p5.rotateX(angles[0]);
            p5.rotateY(angles[1]);
            p5.rotateZ(angles[2]);
            p5.translate(0, 80 / 2, 0);
            p5.cylinder(2, 80);
            p5.pop();
          } else {
            if (objectChecked) {
              p5.push();
              p5.strokeWeight(1);
              p5.translate(x, y, z);
              p5.rotateX(angles[0]);
              p5.rotateY(angles[1]);
              p5.rotateZ(angles[2]);
              p5.translate(0, (80 / 2) * (objectSize / 100), 0);
              p5.scale(objectSize / 100);
              p5.cylinder(2, 80);
              p5.pop();
            }
            if (i == pointPicker.value()) {
              p5.push();
              p5.strokeWeight(1);
              p5.stroke(0, 128, 0);
              p5.translate(x, y, z);
              p5.rotateX(angles[0]);
              p5.rotateY(angles[1]);
              p5.rotateZ(angles[2]);
              p5.translate(0, (80 / 2) * (objectSize / 100), 0);
              p5.scale(objectSize / 100);
              p5.cylinder(2, 80);
              p5.pop();
              selectedPoint = position[i];
            }
            if (trajectoryChecked) {
              p5.strokeWeight(3); // 3
              p5.vertex(x, y, z);
            }
          }
        }
        p5.endShape();
      }
    }
    function drawFromQuaternions(
      dualQuaternions,
      increment,
      frameSize,
      objectSize,
      objectColor,
      lineC
    ) {
      let lineCoordinates = [];
      p5.colorMode(p5.RGB, 255, 255, 255);
      for (let i = 0; i < dualQuaternions.length; i += increment) {
        // calc translation
        const pointPosition = help.dFromDual(dualQuaternions[i]);
        const x = p5.map(pointPosition[0] * -1, 0, 1, -width / 2, width / 2),
          y = p5.map(pointPosition[1] * -1, 0, 1, -height / 2, height / 2);
        let z = (pointPosition[2] * width) / 2;
        if (alternate.length > 0) z = alternate[i];
        lineCoordinates.push([x, y, z]);
        // calc orientation
        const pointOrientation = help.rFromDual(dualQuaternions[i]);
        p5.push();
        // rotation
        const matrix = pointOrientation;
        p5.applyMatrix(
          matrix[0][0],
          matrix[0][1],
          matrix[0][2],
          0,
          matrix[1][0],
          matrix[1][1],
          matrix[1][2],
          0,
          matrix[2][0],
          matrix[2][1],
          matrix[2][2],
          0,
          x,
          y,
          z,
          1
        );
        if (objectChecked) {
          p5.scale(objectSize / 100);
          drawObject(objectColor);
        }
        if (
          i == pointPicker.value() &&
          !bSplineMotionChecked &&
          !bezierMotionChecked &&
          !screwMotionChecked &&
          coordFrameChecked
        ) {
          highlightPoint();
          selectedPoint = dualQuaternions[i];
        }
        if (coordFrameChecked) {
          p5.scale(objectSize / 100);
          drawFrame(frameSize);
        }
        p5.pop();
      }
      if (trajectoryChecked) {
        p5.stroke(lineC[0], lineC[1], lineC[2]);
        p5.strokeWeight(3);
        p5.noFill();
        p5.beginShape();
        for (let i = 0; i < lineCoordinates.length; i += increment) {
          let x = lineCoordinates[i][0],
            y = lineCoordinates[i][1],
            z = lineCoordinates[i][2];
          p5.vertex(x, y, z);
        }
        p5.endShape();
      }
    }
    function drawKeyPositions(dualQuaternions) {
      for (let i = 0; i < dualQuaternions.length; i += 1) {
        // calc translation
        const pointPosition = help.dFromDual(dualQuaternions[i]);
        const x = p5.map(pointPosition[0] * -1, 0, 1, -width / 2, width / 2),
          y = p5.map(pointPosition[1] * -1, 0, 1, -height / 2, height / 2);
        let z = (pointPosition[2] * width) / 2;
        if (alternate.length > 0) z = alternate[i];
        // calc orientation
        const pointOrientation = help.rFromDual(dualQuaternions[i]);
        p5.push();
        // rotation
        const matrix = pointOrientation;
        p5.applyMatrix(
          matrix[0][0],
          matrix[0][1],
          matrix[0][2],
          0,
          matrix[1][0],
          matrix[1][1],
          matrix[1][2],
          0,
          matrix[2][0],
          matrix[2][1],
          matrix[2][2],
          0,
          x,
          y,
          z,
          1
        );
        drawFrame(30);
        drawObject("normalMaterial");
        p5.pop();
      }
    }
    p5.doubleClicked = () => {
      if (spatialChecked) p5.camera(0, 0, 1000);
      else p5.camera();
    };
    p5.draw = () => {
      p5.clear();
      if (timer && spatialChecked) p5.camera(0, 0, 1000);
      if (whiteBGChecked) p5.background("white");
      else p5.background("black");
      // toggling delete button visibility
      if (cMotionChecked) deleteButton.removeAttribute("disabled");
      else deleteButton.attribute("disabled", "");
      // recording has ended and dualPosition has values
      if (position.length > 0 && timer == false) {
        pointPicker.attribute("max", position.length - 1);
      }
      // allows for rotation of view using mouse
      p5.orbitControl();
      if (cMotionChecked) {
        if (dualPosition.length > 0) {
          drawFromQuaternions(
            dualPosition,
            densityIncrement,
            25,
            size,
            "normalMaterial",
            [0, 0, 255]
          );
        }
      }
      if (kMotionChecked)
        if (keyPositions.length > 0) {
          if (jointMotionChecked) {
            drawJoints(keyPositions, 100, 1, true);
          } else if (limbMotionChecked) {
            drawLimbs(keyPositions, 100, 1, true);
          } else {
            drawKeyPositions(keyPositions);
          }
        }
      if (jointMotionChecked) {
        if (position.length > 0 && cMotionChecked) {
          drawJoints(position, size, densityIncrement);
        }
      }
      if (limbMotionChecked) {
        if (position.length > 0 && cMotionChecked) {
          drawLimbs(position, size, densityIncrement, false);
        }
      }
      // type of motion requested (either key positions or continuous motion)
      if (interpolateOnce) {
        interpolateOnce = false;
        // let points = [];
        // if (kMotionChecked) points = keyPositions;
        // if (cMotionChecked) points = keyPositions;
        let points = keyPositions;
        if (points.length > 0 && (contMotionChecked || keyPosChecked)) {
          // screw
          if (screwMotionChecked) screw = help.rationalScrew(points, 0.01);
          else screw = [];
          // bezier
          if (bezierMotionChecked) bezier = help.rationalBezier(points, 0.01);
          else bezier = [];
          // b-spline
          if (bSplineMotionChecked)
            bSpline = help.bSpline(points, degree, 0.01);
          else bSpline = [];
        }
        if (points.length > 0 && jointMotionChecked) {
          if (screwMotionChecked) {
            screw = help.rationalScrewJoints(points, 0.01);
          } else screw = [];
          if (bezierMotionChecked) {
            bezier = help.rationalBezierJoints(points, 0.01);
          } else bezier = [];
          if (bSplineMotionChecked) {
            bSpline = help.bSplineJoints(points, degree, 0.01);
          } else bSpline = [];
        }
        if (points.length > 0 && limbMotionChecked) {
          if (screwMotionChecked) {
            screw = help.rationalScrewLimbs(points, 0.01);
          } else screw = [];
          if (bezierMotionChecked) {
            bezier = [];
          } else bezier = [];
          if (bSplineMotionChecked) {
            bSpline = [];
          } else bSpline = [];
        }
      }

      // if motion approximation data available then draw on canvas
      if (screw.length > 0) {
        if (contMotionChecked || keyPosChecked)
          drawFromQuaternions(
            screw,
            densityIncrement,
            20,
            size,
            "yellow",
            [255, 215, 0]
          );
        if (jointMotionChecked)
          drawJointsMotion(screw, size, densityIncrement, [255, 215, 0]);
        if (limbMotionChecked) drawLimbs(screw, size, densityIncrement, false);
      }
      if (bezier.length > 0) {
        if (contMotionChecked || keyPosChecked)
          drawFromQuaternions(
            bezier,
            densityIncrement,
            20,
            size,
            "red",
            [255, 0, 0]
          );
        if (jointMotionChecked)
          drawJointsMotion(bezier, size, densityIncrement, [255, 0, 0]);
      }
      if (bSpline.length > 0) {
        if (contMotionChecked || keyPosChecked)
          drawFromQuaternions(
            bSpline,
            densityIncrement,
            20,
            size,
            "green",
            [0, 255, 0]
          );
        if (jointMotionChecked)
          drawJointsMotion(bSpline, size, densityIncrement, [0, 255, 0]);
      }
    };
  }
  function JointInterface(p5) {
    let w = 640, //-320
      h = 480; //-240
    p5.setup = () => {
      p5.createCanvas(w, h, p5.WEBGL);
    };
    p5.draw = () => {
      p5.clear();
      p5.background("black");
      if (timer) {
        p5.camera(0, 0, 1000);
        if (poses) {
          let connections1 = [
            poses[15],
            poses[13],
            poses[11],
            poses[23],
            poses[25],
            poses[27],
          ];
          let connections2 = [
            poses[16],
            poses[14],
            poses[12],
            poses[24],
            poses[26],
            poses[28],
          ];
          let connections3 = [poses[11], poses[12]];
          let connections4 = [poses[23], poses[24]];
          let connections5 = [poses[7], poses[2], poses[0], poses[5], poses[8]];
          let indecies = [
            0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
          ];
          for (let j = 0; j < indecies.length; j++) {
            const i = indecies[j];
            if (i >= 11) drawLandmark(poses[i], 1);
            else drawLandmark(poses[i], 0.5);
          }
          drawConnections(connections1);
          drawConnections(connections2);
          drawConnections(connections3);
          drawConnections(connections4);
          drawConnections(connections5);
        }
      } else {
        p5.camera();
        drawLimb(
          320 - 320,
          100 - 240,
          320 - 320,
          200 - 240,
          limbSelected.spine
        );
        drawLimb(
          390 - 320,
          100 - 240,
          450 - 320,
          140 - 240,
          limbSelected.luarm
        );
        drawLimb(
          250 - 320,
          100 - 240,
          190 - 320,
          140 - 240,
          limbSelected.ruarm
        );
        drawLimb(
          190 - 320,
          140 - 240,
          140 - 320,
          120 - 240,
          limbSelected.rlarm
        );
        drawLimb(
          450 - 320,
          140 - 240,
          500 - 320,
          120 - 240,
          limbSelected.llarm
        );
        drawLimb(
          270 - 320,
          200 - 240,
          250 - 320,
          280 - 240,
          limbSelected.ruleg
        );
        drawLimb(
          370 - 320,
          200 - 240,
          390 - 320,
          280 - 240,
          limbSelected.luleg
        );
        drawLimb(
          250 - 320,
          280 - 240,
          270 - 320,
          360 - 240,
          limbSelected.rlleg
        );
        drawLimb(
          390 - 320,
          280 - 240,
          370 - 320,
          360 - 240,
          limbSelected.llleg
        );
        drawOtherLimbs();

        drawHead(320 - 320, 50 - 240); // head denoted by nose kp

        drawJoint(250 - 320, 100 - 240, jointSelected.rshoulder); // right shoulder
        drawJoint(390 - 320, 100 - 240, jointSelected.lshoulder); // left shoulder
        drawJoint(190 - 320, 140 - 240, jointSelected.relbow); // right elbow
        drawJoint(450 - 320, 140 - 240, jointSelected.lelbow); // left elbow
        drawJoint(140 - 320, 120 - 240, jointSelected.rwrist); // right wrist
        drawJoint(500 - 320, 120 - 240, jointSelected.lwrist); // left wrist

        drawJoint(270 - 320, 200 - 240, jointSelected.rhip); // right hip
        drawJoint(370 - 320, 200 - 240, jointSelected.lhip); // left hip
        drawJoint(250 - 320, 280 - 240, jointSelected.rknee); // right knee
        drawJoint(390 - 320, 280 - 240, jointSelected.lknee); // left knee
        drawJoint(270 - 320, 360 - 240, jointSelected.rankle); // right ankle
        drawJoint(370 - 320, 360 - 240, jointSelected.lankle); // left ankle
      }
    };
    function drawLandmark(joint, size) {
      const x = p5.map(joint.x, 0, 1, -320, 320);
      const y = p5.map(joint.y, 0, 1, -240, 240);
      const z = joint.z * -320;
      p5.push();
      p5.stroke("red");
      p5.translate(x, y, z);
      p5.scale(size);
      p5.sphere(10);
      p5.pop();
    }
    function drawConnections(array) {
      p5.stroke("green");
      p5.strokeWeight(5);
      p5.noFill();
      p5.beginShape();
      for (let i = 0; i < array.length; i++) {
        const x = p5.map(array[i].x, 0, 1, -320, 320);
        const y = p5.map(array[i].y, 0, 1, -240, 240);
        const z = array[i].z * -320;
        p5.vertex(x, y, z);
      }
      p5.endShape();
    }
    function drawJoint(x, y, joint) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      if (joint.selected)
        p5.stroke(joint.color[0], joint.color[1], joint.color[2]);
      else p5.stroke(255, 255, 255);
      p5.strokeWeight(2);
      //p5.circle(x, y, 20);
      p5.push();
      p5.translate(x, y);
      p5.sphere(10);
      p5.pop();
    }

    function drawOtherLimbs() {
      p5.strokeWeight(4);
      p5.stroke("green");
      p5.line(380 - 320, 100 - 240, 260 - 320, 100 - 240);
      p5.line(280 - 320, 200 - 240, 360 - 320, 200 - 240);
    }

    function drawHead(x, y) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      p5.fill(0, 0, 0);
      p5.stroke("green");
      p5.strokeWeight(4);
      p5.circle(x, y, 40);
    }

    function drawLimb(x1, y1, x2, y2, limb) {
      p5.colorMode(p5.RGB, 255, 255, 255);
      if (limb.selected) {
        p5.stroke(limb.color[0], limb.color[1], limb.color[2]);
        p5.strokeWeight(4);
        p5.line(x1, y1, x2, y2);
      } else {
        p5.stroke(0, 128, 0);
        p5.strokeWeight(4);
        p5.line(x1, y1, x2, y2);
      }
    }

    p5.mousePressed = () => {
      let x = p5.mouseX,
        y = p5.mouseY;
      // example for head/nose
      // eq: (x-centerX)**2+(y-centerY)**2 <= radius**2
      // radius = 10

      if (limbMotionChecked) {
        if (
          p5.dist(320, 100, x, y) + p5.dist(320, 200, x, y) <=
            p5.dist(320, 100, 320, 200) + 1 &&
          p5.dist(320, 100, x, y) + p5.dist(320, 200, x, y) >=
            p5.dist(320, 100, 320, 200) - 1
        ) {
          limbSelected.spine.selected = !limbSelected.spine.selected;
        }
        if (
          p5.dist(390, 100, x, y) + p5.dist(450, 140, x, y) <=
            p5.dist(390, 100, 450, 140) + 1 &&
          p5.dist(390, 100, x, y) + p5.dist(450, 140, x, y) >=
            p5.dist(390, 100, 450, 140) - 1
        ) {
          limbSelected.luarm.selected = !limbSelected.luarm.selected;
        }
        if (
          p5.dist(250, 100, x, y) + p5.dist(190, 140, x, y) <=
            p5.dist(250, 100, 190, 140) + 1 &&
          p5.dist(250, 100, x, y) + p5.dist(190, 140, x, y) >=
            p5.dist(250, 100, 190, 140) - 1
        ) {
          limbSelected.ruarm.selected = !limbSelected.ruarm.selected;
        }
        if (
          p5.dist(190, 140, x, y) + p5.dist(140, 120, x, y) <=
            p5.dist(190, 140, 140, 120) + 1 &&
          p5.dist(190, 140, x, y) + p5.dist(140, 120, x, y) >=
            p5.dist(190, 140, 140, 120) - 1
        ) {
          limbSelected.rlarm.selected = !limbSelected.rlarm.selected;
        }
        if (
          p5.dist(450, 140, x, y) + p5.dist(500, 120, x, y) <=
            p5.dist(450, 140, 500, 120) + 1 &&
          p5.dist(450, 140, x, y) + p5.dist(500, 120, x, y) >=
            p5.dist(450, 140, 500, 120) - 1
        ) {
          limbSelected.llarm.selected = !limbSelected.llarm.selected;
        }
        if (
          p5.dist(270, 200, x, y) + p5.dist(250, 280, x, y) <=
            p5.dist(270, 200, 250, 280) + 1 &&
          p5.dist(270, 200, x, y) + p5.dist(250, 280, x, y) >=
            p5.dist(270, 200, 250, 280) - 1
        ) {
          limbSelected.ruleg.selected = !limbSelected.ruleg.selected;
        }
        if (
          p5.dist(370, 200, x, y) + p5.dist(390, 280, x, y) <=
            p5.dist(370, 200, 390, 280) + 1 &&
          p5.dist(370, 200, x, y) + p5.dist(390, 280, x, y) >=
            p5.dist(370, 200, 390, 280) - 1
        ) {
          limbSelected.luleg.selected = !limbSelected.luleg.selected;
        }
        if (
          p5.dist(250, 280, x, y) + p5.dist(270, 360, x, y) <=
            p5.dist(250, 280, 270, 360) + 1 &&
          p5.dist(250, 280, x, y) + p5.dist(270, 360, x, y) >=
            p5.dist(250, 280, 270, 360) - 1
        ) {
          limbSelected.rlleg.selected = !limbSelected.rlleg.selected;
        }
        if (
          p5.dist(390, 280, x, y) + p5.dist(370, 360, x, y) <=
            p5.dist(390, 280, 370, 360) + 1 &&
          p5.dist(390, 280, x, y) + p5.dist(370, 360, x, y) >=
            p5.dist(390, 280, 370, 360) - 1
        ) {
          limbSelected.llleg.selected = !limbSelected.llleg.selected;
        }
      }
      if (jointMotionChecked) {
        if ((x - 250) ** 2 + (y - 100) ** 2 <= 10 ** 2)
          jointSelected.rshoulder.selected = !jointSelected.rshoulder.selected;
        if ((x - 390) ** 2 + (y - 100) ** 2 <= 10 ** 2)
          jointSelected.lshoulder.selected = !jointSelected.lshoulder.selected;
        if ((x - 190) ** 2 + (y - 140) ** 2 <= 10 ** 2)
          jointSelected.relbow.selected = !jointSelected.relbow.selected;
        if ((x - 450) ** 2 + (y - 140) ** 2 <= 10 ** 2)
          jointSelected.lelbow.selected = !jointSelected.lelbow.selected;
        if ((x - 140) ** 2 + (y - 120) ** 2 <= 10 ** 2)
          jointSelected.rwrist.selected = !jointSelected.rwrist.selected;
        if ((x - 500) ** 2 + (y - 120) ** 2 <= 10 ** 2)
          jointSelected.lwrist.selected = !jointSelected.lwrist.selected;
        if ((x - 270) ** 2 + (y - 200) ** 2 <= 10 ** 2)
          jointSelected.rhip.selected = !jointSelected.rhip.selected;
        if ((x - 370) ** 2 + (y - 200) ** 2 <= 10 ** 2)
          jointSelected.lhip.selected = !jointSelected.lhip.selected;
        if ((x - 250) ** 2 + (y - 280) ** 2 <= 10 ** 2)
          jointSelected.rknee.selected = !jointSelected.rknee.selected;
        if ((x - 390) ** 2 + (y - 280) ** 2 <= 10 ** 2)
          jointSelected.lknee.selected = !jointSelected.lknee.selected;
        if ((x - 270) ** 2 + (y - 360) ** 2 <= 10 ** 2)
          jointSelected.rankle.selected = !jointSelected.rankle.selected;
        if ((x - 370) ** 2 + (y - 360) ** 2 <= 10 ** 2)
          jointSelected.lankle.selected = !jointSelected.lankle.selected;
      }
      // if ((x - 320) ** 2 + (y - 200) ** 2 <= 10 ** 2)
      //   pelvisSelected = !pelvisSelected;

      // if ((x - 320) ** 2 + (y - 100) ** 2 <= 10 ** 2)
      //   neckSelected = !neckSelected;
    };
  }
  return (
    <div style={{ position: "relative" }}>
      <video
        ref={input_video}
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      ></video>
      <canvas
        ref={output_canvas}
        width="640"
        height="480"
        style={{ position: "absolute", top: 0, left: 0 }}
      ></canvas>
      <div style={{ position: "absolute", top: 0, left: 640 }}>
        <ReactP5Wrapper sketch={JointInterface} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 0,
          width: 640,
          height: 480,
          backgroundColor: "#dcdcdc",
        }}
      >
        <ReactP5Wrapper sketch={sketch} />
      </div>
      <div style={{ position: "absolute", top: 480, left: 640 }}>
        <ReactP5Wrapper sketch={userInterface} />
      </div>
    </div>
  );
}
