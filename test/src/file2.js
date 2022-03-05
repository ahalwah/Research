import React, { useRef, useEffect } from "react";
import Homogenous_Matrix from "./functions/axis_angle";
import Dual_quat from "./functions/dual_quaternion";
import Translation from "./functions/dFromDual";
import { ReactP5Wrapper } from "react-p5-wrapper";
import * as math from "mathjs";
import * as Holistic from "@mediapipe/holistic/holistic";
// mediapipe camrea tools
import * as Camera from "@mediapipe/camera_utils/camera_utils";
// mediapipe drawing tools
import * as Drawing from "@mediapipe/drawing_utils/drawing_utils";

export default function File2() {
  var startTime, endTime;
  var P1 = []; // Child for p5 0.5, 0.8, 0
  var P2 = []; // Parent for p5 0.5, 0.5, 0
  var pointsArray = []; // holds point for a recording
  var dual_quatArr = []; // holds dual quaternions
  var bezier = []; // holds bezier dual quaternions

  const lerp = (p0, p1, t) => {
    return (1 - t) * p0 + t * p1;
  };

  const binomial = (n, k) => {
    let nf = math.factorial(n);
    let kf = math.factorial(k);
    let nkf = math.factorial(n - k);

    return nf / (kf * nkf);
  };

  const Bernstein = (dualArray) => {
    var n = dualArray.length;
    var result = [];
    if (n >= 2)
      for (let t = 0; t <= 1; t += 0.1) {
        let sum_real = [0, 0, 0, 0],
          sum_dual = [0, 0, 0, 0];
        for (let i = 0; i < n; i++) {
          let real = dualArray[i].real;
          let dual = dualArray[i].dual;
          let bern = binomial(n - 1, i) * t ** i * (1 - t) ** (n - 1 - i);
          sum_real = math.add(sum_real, math.multiply(bern, real));
          sum_dual = math.add(sum_dual, math.multiply(bern, dual));
        }
        // dual quaternion @t = {real: sum_real, dual: sum_dual}
        let pi = Translation(dualArray[0]);
        let pm = Translation({ real: sum_real, dual: sum_dual });
        let pf = Translation(dualArray[n - 1]);

        let x1 = lerp(pi.x, pm.x, t);
        let y1 = lerp(pi.y, pm.y, t);
        let x2 = lerp(pm.x, pf.x, t);
        let y2 = lerp(pm.y, pf.y, t);
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);
        result.push({ x: x, y: y });
      }
    return result;
  };
  // React DOM references
  const output_canvas = useRef(null);
  const input_video = useRef(null);

  function onStart() {
    startTime = new Date();
  }
  function onStop() {
    endTime = new Date();
    var timeDiff = endTime - startTime; //in ms
    // strip the ms
    timeDiff /= 1000;

    // get seconds
    var seconds = math.round(timeDiff);
    console.log(seconds + " seconds");

    // calculate bezier dual quaternions
    // real => rotation
    // dual => translation
    bezier = Bernstein(dual_quatArr);
    console.log(dual_quatArr);
    console.log(bezier);
    // post processing, clear arrays for reuse
    pointsArray = [];
    dual_quatArr = [];
    bezier = [];
  }
  // const onResults = (results) => {
  //   // Draw landmark guides
  //   if (results) {
  //     drawResults(results);
  //     if (results.poseLandmarks) {
  //       let shoulder = results.poseLandmarks[11],
  //         elbow = results.poseLandmarks[13];
  //       P1 = [shoulder.x, shoulder.y, 0]; //, -1 * shoulder.z]; // invert z-axis
  //       P2 = [elbow.x, elbow.y, 0]; //, -1 * elbow.z]; // invert z-axis
  //       if (startTime) {
  //         if (!endTime) {
  //           pointsArray.push({
  //             P1: { x: shoulder.x, y: shoulder.y, z: 0 },
  //             P2: { x: elbow.x, y: elbow.y, z: 0 },
  //           });
  //           let output = Homogenous_Matrix(P1, P2, 0);
  //           let quaternion = Homogenous_Matrix(P1, P2, 1);
  //           let dual_quat = Dual_quat(output, quaternion);
  //           dual_quatArr.push(dual_quat); // append dual quaternion to array
  //         }
  //       }
  //     }
  //   }
  // };
  // const drawResults = (results) => {
  //   const canvasElement = output_canvas.current;
  //   const canvasCtx = canvasElement.getContext("2d");
  //   canvasCtx.save();
  //   canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //   // Only overwrite existing pixels.
  //   canvasCtx.globalCompositeOperation = "source-in";
  //   canvasCtx.fillStyle = "#00FF00";
  //   canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  //   // Only overwrite missing pixels.
  //   canvasCtx.globalCompositeOperation = "destination-atop";
  //   canvasCtx.drawImage(
  //     results.image,
  //     0,
  //     0,
  //     canvasElement.width,
  //     canvasElement.height
  //   );

  //   canvasCtx.globalCompositeOperation = "source-over";
  //   Drawing.drawConnectors(
  //     canvasCtx,
  //     results.poseLandmarks,
  //     Holistic.POSE_CONNECTIONS,
  //     {
  //       color: "#00FF00",
  //       lineWidth: 4,
  //     }
  //   );
  //   Drawing.drawLandmarks(canvasCtx, results.poseLandmarks, {
  //     color: "#FF0000",
  //     lineWidth: 2,
  //   });
  //   canvasCtx.restore();
  // };

  // useEffect(() => {
  //   const holistic = new Holistic.Holistic({
  //     locateFile: (file) => {
  //       return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
  //     },
  //   });

  //   holistic.setOptions({
  //     modelComplexity: 1,
  //     smoothLandmarks: true,
  //     enableSegmentation: true,
  //     smoothSegmentation: true,
  //     refineFaceLandmarks: true,
  //     minDetectionConfidence: 0.5,
  //     minTrackingConfidence: 0.5,
  //   });

  //   holistic.onResults(onResults);

  //   const camera = new Camera.Camera(input_video.current, {
  //     onFrame: async () => {
  //       await holistic.send({ image: input_video.current });
  //     },
  //     width: 640,
  //     height: 480,
  //   });
  //   camera.start();
  // }, []);
  function sketch3(p5) {
    var calcDualBtn;
    var drawingPoints = [];
    var height = 480,
      width = 480;
    p5.setup = () => {
      p5.createCanvas(width, height);
      calcDualBtn = p5.createButton("Calculate Dual Quat");
      calcDualBtn.mousePressed(calcDual);
    };
    p5.draw = () => {
      p5.clear();
      p5.background(220);
      p5.stroke("green");
      p5.strokeWeight("5");
      for (let i = 0; i < pointsArray.length; i += 1) {
        const point = pointsArray[i];
        p5.point(point[0], point[1]);
      }
      // draw line
      p5.stroke("blue");
      p5.strokeWeight("3");
      for (let i = 0; i < pointsArray.length - 1; i += 2) {
        const point1 = pointsArray[i];
        const point2 = pointsArray[i + 1];
        p5.line(point1[0], point1[1], point2[0], point2[1]);
      }
      if (drawingPoints) {
        p5.stroke("red");
        p5.noFill();
        p5.beginShape();
        for (let i = 0; i < drawingPoints.length; i += 1) {
          let x = drawingPoints[i].x;
          let y = drawingPoints[i].y;
          p5.vertex(x, y);
        }
        p5.endShape();
      }
    };
    p5.mousePressed = () => {
      pointsArray.push([p5.mouseX, p5.mouseY, 0]);
    };
    p5.keyPressed = () => {
      if (p5.keyCode == p5.BACKSPACE) pointsArray.pop();
      if (p5.keyCode == p5.DELETE) {
        pointsArray = [];
        dual_quatArr = [];
        // drawingPoints = []
      }
    };
    function calcDual() {
      drawingPoints = [];
      dual_quatArr = [];
      if (pointsArray.length >= 2) {
        let index = 0;
        let n = pointsArray.length / 2;
        dual_quatArr.fill(0, 0, n);
        for (let i = 0; i < pointsArray.length; i += 2) {
          const P1 = pointsArray[i];
          const P2 = pointsArray[i + 1];
          let output = Homogenous_Matrix(P1, P2, 0);
          let quaternion = Homogenous_Matrix(P1, P2, 1);
          let dual_quat = Dual_quat(output, quaternion);
          dual_quatArr[index] = dual_quat;
          index += 1;
        }
      }
      console.log(pointsArray);
      console.log(dual_quatArr);
      let arr = Bernstein(dual_quatArr);
      for (let i = 0; i < arr.length; i += 1) {
        let x = arr[i].x;
        let y = arr[i].y;
        let xNew = p5.map(-1 * x, 0, 1, 0, 100);
        let yNew = p5.map(-1 * y, 0, 1, 0, 100);
        drawingPoints.push({ x: xNew, y: yNew });
      }
    }
  }
  // function sketch2(p5) {
  //   let width = 480,
  //     height = 480;
  //   p5.setup = () => {
  //     p5.createCanvas(width, height);
  //   };
  //   p5.draw = () => {
  //     p5.clear();
  //     p5.background(220);
  //     p5.strokeWeight(2);
  //     p5.stroke("blue");
  //     p5.line(
  //       width / 2,
  //       height / 2,
  //       p5.map(P1[0], 0, 1, 0, width),
  //       p5.map(P1[1], 0, 1, 0, height)
  //     );
  //     p5.strokeWeight(5);
  //     p5.stroke("green");
  //     p5.point(p5.map(P1[0], 0, 1, 0, width), p5.map(P1[1], 0, 1, 0, height));
  //     p5.point(width / 2, height / 2);
  //     p5.stroke("brown");
  //     p5.line(0, 0, 0, height);
  //   };
  //   p5.mousePressed = () => {
  //     if (p5.mouseButton === p5.LEFT) {
  //       let x = p5.mouseX;
  //       let y = p5.mouseY;
  //       P1 = [p5.map(x, 0, width, 0, 1), p5.map(y, 0, height, 0, 1), 0];
  //     }
  //   };
  // }
  function sketch(p5) {
    var height = 480,
      width = 640;
    var output = [];
    p5.setup = () => {
      p5.createCanvas(width, height, p5.WEBGL);
    };
    p5.draw = () => {
      p5.clear();
      p5.background(220);
      p5.push();
      p5.strokeWeight(2);
      p5.stroke("blue");
      p5.line(0, 0, 0, 100);
      p5.stroke("red");
      p5.line(0, 0, 100, 0);
      p5.pop();
      if (P1 && P2) {
        output = Homogenous_Matrix(P1, P2, 0);
      }
      if (output) {
        p5.applyMatrix(
          output[0][0],
          output[0][1],
          output[0][2],
          0,
          output[1][0],
          output[1][1],
          output[1][2],
          0,
          output[2][0],
          output[2][1],
          output[2][2],
          0,
          0,
          0,
          0,
          1
        );
        p5.translate(0, 50);
        p5.cylinder(10, 100);
      }
    };
  }
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {/* <video ref={input_video} hidden></video>
      <canvas ref={output_canvas} width="640" height="480"></canvas> */}
      <ReactP5Wrapper sketch={sketch3} />
      {/* <ReactP5Wrapper sketch={sketch2} /> */}
      {/* <button onClick={() => onStart()}>Start</button>
      <button onClick={() => onStop()}>Stop</button> */}
    </div>
  );
}
