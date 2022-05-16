import React from "react";
import Button from "react-bootstrap/Button";
import { ReactP5Wrapper } from "react-p5-wrapper";
import Inconsolata from "./font/Inconsolata-Black.otf";
import * as poseDetection from "@tensorflow-models/pose-detection";
//import "@tensorflow/tfjs-backend-webgl"; // for tfjs
import * as Pose from "@mediapipe/pose/pose"; //
import * as Camera from "@mediapipe/camera_utils/camera_utils";
import pose from "./pose.js";
import torsoURL from "./assets/torso.obj";
import headURL from "./assets/head.obj";
import larm1URL from "./assets/left arm 1.obj";
import larm2URL from "./assets/left arm 2.obj";
import lfootURL from "./assets/left foot.obj";
import lhandURL from "./assets/left hand.obj";
import lleg1URL from "./assets/left leg 1.obj";
import lleg2URL from "./assets/left leg 2.obj";
import rarm1URL from "./assets/right arm 1.obj";
import rarm2URL from "./assets/right arm 2.obj";
import rfootURL from "./assets/right foot.obj";
import rhandURL from "./assets/right hand.obj";
import rleg1URL from "./assets/right leg 1.obj";
import rleg2URL from "./assets/right leg 2.obj";

export default function App() {
  var state = "not pressed";
  var bodypart = new Array(26).fill(false);
  var values = new Array(26).fill(null);
  var track = [];
  var order1 = [
    19, 17, 15, 19, 15, 21, 15, 13, 11, 12, 14, 16, 22, 16, 20, 16, 18, 20,
  ];
  var order2 = [11, 23, 25, 27, 29, 31, 27];
  var order3 = [12, 24, 23, 24, 26, 28, 30, 32, 28];
  var order4 = [7, 2, 0, 5, 8];
  var order5 = [9, 10];

  function sketch2(p) {
    let poses;

    let video;
    let camera;
    let pose;

    function onResults(results) {
      // pose detection
      if (results.poseLandmarks) {
        poses = results.poseLandmarks;
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

      p.createCanvas(800, 480);
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

    // x,y of chosen joints for drawing

    // use keypoint3d to get -1 to 1 meters
    // orientation of limbs (angle) degrees
    // velocity of limbs m/s
    // acceleration of limbs m/s

    p.draw = function () {
      let time;
      p.background("black");
      p.image(video, 0, 0);
      if (poses && poses.length > 0) {
        track = [];
        time = new Date().getTime();

        if (bodypart[0]) track = [12, 14];
        if (bodypart[1]) {
          if (!track.includes(14)) track.push(14);
          if (!track.includes(16)) track.push(16);
        }
        if (bodypart[2]) {
          if (!track.includes(11)) track.push(11);
          if (!track.includes(13)) track.push(13);
        }
        if (bodypart[3]) {
          if (!track.includes(13)) track.push(13);
          if (!track.includes(15)) track.push(15);
        }
        if (bodypart[4]) {
          if (!track.includes(24)) track.push(24);
          if (!track.includes(26)) track.push(26);
        }
        if (bodypart[5]) {
          if (!track.includes(26)) track.push(26);
          if (!track.includes(28)) track.push(28);
        }
        if (bodypart[6]) {
          if (!track.includes(23)) track.push(23);
          if (!track.includes(25)) track.push(25);
        }
        if (bodypart[7]) {
          if (!track.includes(25)) track.push(25);
          if (!track.includes(27)) track.push(27);
        }
        if (bodypart[8]) {
          if (!track.includes(28)) track.push(28);
          if (!track.includes(30)) track.push(30);
          if (!track.includes(32)) track.push(32);
        }
        if (bodypart[9]) {
          if (!track.includes(27)) track.push(27);
          if (!track.includes(29)) track.push(29);
          if (!track.includes(31)) track.push(31);
        }
        if (bodypart[10]) {
          if (!track.includes(16)) track.push(16);
          if (!track.includes(18)) track.push(18);
          if (!track.includes(20)) track.push(20);
        }
        if (bodypart[11]) {
          if (!track.includes(15)) track.push(15);
          if (!track.includes(17)) track.push(17);
          if (!track.includes(19)) track.push(19);
        }
        if (bodypart[12]) {
          if (!track.includes(22)) track.push(22);
        }
        if (bodypart[13]) {
          if (!track.includes(20)) track.push(20);
        }
        if (bodypart[14]) {
          if (!track.includes(18)) track.push(18);
        }
        if (bodypart[15]) {
          if (!track.includes(21)) track.push(21);
        }
        if (bodypart[16]) {
          if (!track.includes(19)) track.push(19);
        }
        if (bodypart[17]) {
          if (!track.includes(17)) track.push(17);
        }
        if (bodypart[18]) {
          if (!track.includes(11)) track.push(11);
          if (!track.includes(12)) track.push(12);
          if (!track.includes(23)) track.push(23);
          if (!track.includes(24)) track.push(24);
        }
        if (bodypart[19]) {
          if (!track.includes(0)) track.push(0);
        }
        if (bodypart[20]) {
          if (!track.includes(0)) track.push(0);
        }
        if (bodypart[21]) {
          if (!track.includes(9)) track.push(9);
          if (!track.includes(10)) track.push(10);
        }
        if (bodypart[22]) {
          if (!track.includes(8)) track.push(8);
        }
        if (bodypart[23]) {
          if (!track.includes(7)) track.push(7);
        }
        if (bodypart[24]) {
          if (!track.includes(5)) track.push(5);
        }
        if (bodypart[25]) {
          if (!track.includes(2)) track.push(2);
        }

        p.fill("#006400");
        p.strokeWeight(4);
        if (track.length > 0) {
          order4.forEach((element, index) => {
            if (track.includes(element)) {
              if (index < order4.length - 1) {
                if (track.includes(order4[index + 1])) {
                  p.line(
                    mapping(poses[element].x, 0, 1, 0, 640),
                    mapping(poses[element].y, 0, 1, 0, 480),
                    mapping(poses[order4[index + 1]].x, 0, 1, 0, 640),
                    mapping(poses[order4[index + 1]].y, 0, 1, 0, 480)
                  );
                }
              } else {
                if (track.includes(order4[index - 1])) {
                  p.line(
                    mapping(poses[element].x, 0, 1, 0, 640),
                    mapping(poses[element].y, 0, 1, 0, 480),
                    mapping(poses[order4[index - 1]].x, 0, 1, 0, 640),
                    mapping(poses[order4[index - 1]].y, 0, 1, 0, 480)
                  );
                }
              }
            }
          });
          p.strokeWeight(1);
          for (let i = 0; i < track.length; i++) {
            p.circle(
              mapping(poses[track[i]].x, 0, 1, 0, 640),
              mapping(poses[track[i]].y, 0, 1, 0, 480),
              20
            );
          }
        }

        // recording
        if (state === "pressed") {
          p.fill("white");
          p.textSize(25);
          p.text("Recording ...", 650, 50);
          for (let i = 0; i < track.length; i++) {
            let previousIndex = values[track[i]].length - 2;
            if (values[track[i]].length > 1) {
              let v1 = values[track[i]][previousIndex].velocity;
              let distance = p.dist(
                poses[track[i]].x,
                poses[track[i]].y,
                values[track[i]][previousIndex].x,
                values[track[i]][previousIndex].y
              );
              let dt = time - values[track[i]][previousIndex].time;
              let v2 = distance / dt;
              let a2 = p.abs(v2 - v1) / dt;

              values[track[i]].push({
                x: poses[track[i]].x,
                y: poses[track[i]].y,
                time: time,
                velocity: v2,
                acceleration: a2,
              });
            } else {
              values[track[i]].push({
                x: poses[track[i]].x,
                y: poses[track[i]].y,
                time: time,
                velocity: 0,
                acceleration: 0,
              });
            }
          }
        }
        //
      } else {
        console.log(values);
      }
      //console.log(state);
    };
  }
  function mapping(number, inMin, inMax, outMin, outMax) {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
  function sketch(p5) {
    let myFont;
    let color1 = "grey";
    let color2 = "#196B21";
    /*
    0 left arm 1    12,14
    1 left arm 2    14,16
    2 right arm 1   11,13
    3 right arm 2   13,15
    4 left leg 1    24,26
    5 left leg 2    26,28
    6 right leg 1   23,25
    7 right leg 2   25,27
    8 left foot     28,30,32
    9 right foot    27,29,31
    10 left hand    16,18,20
    11 right hand   15,17,19
    12 left thumb   22
    13 left index   20
    14 left pinky   18
    15 right thumb  21
    16 right index  19
    17 right pinky  17
    18 torso        11,12,23,24
    19 head         0
    20 nose         0
    21 mouth        9,10
    22 left ear     8
    23 right ear    7
    24 left eye     5
    25 right eye    2
    */
    let h = [
      -110, -180, 110, 180, -50, -50, 50, 50, -70, 70, -180, 180, -159, -170,
      -200, 159, 170, 200, 0, 0, 0, 0, 50, -50, 20, -20,
    ];
    let k = [
      -110, -180, -110, -180, 110, 240, 110, 240, 315, 315, -265, -265, -277,
      -295, -285, -277, -295, -285, -30, -180, -175, -155, -180, -180, -190,
      -190,
    ];
    let rx = [
      65, 25, 65, 25, 25, 25, 25, 25, 65, 65, 17.5, 17.5, 10, 10, 10, 10, 10,
      10, 75, 45, 10, 40, 5, 5, 10, 10,
    ];
    let ry = [
      25, 65, 25, 65, 65, 65, 65, 65, 25, 25, 17.5, 17.5, 25, 30, 25, 25, 30,
      25, 100, 45, 15, 10, 12.5, 12.5, 10, 10,
    ];

    p5.preload = () => {
      myFont = p5.loadFont(Inconsolata);
    };

    p5.setup = () => {
      p5.createCanvas(600, 700, p5.WEBGL);
    };

    p5.draw = () => {
      p5.background("black");

      p5.fill("green");
      p5.textFont(myFont);
      p5.textSize(40);
      p5.text("Left", 50, -280);
      p5.text("Right", -130, -280);

      p5.fill(color1);
      if (!bodypart[18]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(0, -30, 150, 200); // torso
      if (!bodypart[19]) p5.fill(color1);
      else p5.fill(color2);
      p5.circle(0, -180, 90); // head
      if (!bodypart[24]) p5.fill(color1);
      else p5.fill(color2);
      p5.circle(-20, -190, 20); // right eye
      if (!bodypart[25]) p5.fill(color1);
      else p5.fill(color2);
      p5.circle(20, -190, 20); // left eye
      if (!bodypart[22]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-50, -180, 10, 25); // right ear
      if (!bodypart[23]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(50, -180, 10, 25); // left ear
      if (!bodypart[20]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(0, -175, 10, 15); // nose
      if (!bodypart[21]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(0, -155, 40, 10); // mouth

      // right arm 1
      p5.push();
      if (!bodypart[2]) p5.fill(color1);
      else p5.fill(color2);
      p5.rotateZ((-90 * p5.PI) / 180);
      p5.ellipse(110, -110, 50, 130);
      p5.pop();
      // right arm 2
      p5.push();
      if (!bodypart[3]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-180, -180, 50, 130);
      p5.pop();
      // right hand
      if (!bodypart[11]) p5.fill(color1);
      else p5.fill(color2);
      p5.push();
      p5.circle(-180, -265, 35); // hand
      p5.translate(-180, -265, 0);
      if (!bodypart[17]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-20, -20, 10, 25); // pinky
      p5.ellipse(-10, -30, 10, 30); // ring
      p5.ellipse(0, -33, 10, 30); // middle
      if (!bodypart[16]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(10, -30, 10, 30); // index
      if (!bodypart[15]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(21, -12, 10, 25); // thumb
      p5.pop();

      // left arm 1
      p5.push();
      if (!bodypart[0]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(110, -110, 130, 50);
      p5.pop();
      // left arm 2
      p5.push();
      if (!bodypart[1]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(180, -180, 50, 130);
      p5.pop();
      // left hand
      if (!bodypart[10]) p5.fill(color1);
      else p5.fill(color2);
      p5.push();
      p5.circle(180, -265, 35); // hand
      p5.translate(180, -265, 0);
      if (!bodypart[14]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(20, -20, 10, 25); // pinky
      if (!bodypart[13]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-10, -30, 10, 30); // index
      p5.fill(color1);
      p5.ellipse(0, -33, 10, 30); // middle
      p5.fill(color1);
      p5.ellipse(10, -30, 10, 30); // ring
      if (!bodypart[12]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-21, -12, 10, 25); // thumb
      p5.pop();

      // right leg 1
      if (!bodypart[6]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-50, 110, 50, 130);
      // right leg 2
      if (!bodypart[7]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-50, 240, 50, 130);
      // right foot
      if (!bodypart[9]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(-70, 315, 60, 30);

      //left leg 1
      if (!bodypart[4]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(50, 110, 50, 130);
      //left leg 2
      if (!bodypart[5]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(50, 240, 50, 130);
      // left foot
      if (!bodypart[8]) p5.fill(color1);
      else p5.fill(color2);
      p5.ellipse(70, 315, 60, 30);
    };

    p5.mouseClicked = () => {
      let x = 300 - p5.mouseX;
      let y = p5.mouseY - 350;
      let indecies = [20, 21, 24, 25];
      let hval,
        hbool = true;
      let value,
        temp = [];
      const reducer = (accumulator, curr) => accumulator + curr;
      for (let i = 0; i < h.length; i++) {
        //https://math.stackexchange.com/questions/76457/check-if-a-point-is-within-an-ellipse
        value = (x - h[i]) ** 2 / rx[i] ** 2 + (y - k[i]) ** 2 / ry[i] ** 2;
        if (i !== 19) if (value <= 1) bodypart[i] = !bodypart[i];
        if (i === 19) hval = value;
        if (indecies.includes(i)) temp.push(value);
      }
      if (hval <= 1 && temp.reduce(reducer) > 4) {
        for (let i = 0; i < temp.length; i++) {
          if (temp[i] <= 1) {
            hbool = false;
            break;
          }
        }
        if (hbool) bodypart[19] = !bodypart[19];
      }
      //console.log(bodypart);
    };
  }
  // was called sketch, changed name to exist without commenting
  function sketch2(p5) {
    let myFont;
    let offset = 90;
    let torso,
      head,
      rleg1,
      rleg2,
      lleg1,
      lleg2,
      rarm1,
      rarm2,
      larm1,
      larm2,
      lhand,
      rhand,
      lfoot,
      rfoot;
    /*
    0 left arm 1    12,14
    1 left arm 2    14,16
    2 right arm 1   11,13
    3 right arm 2   13,15
    4 left leg 1    24,26
    5 left leg 2    26,28
    6 right leg 1   23,25
    7 right leg 2   25,27
    8 left foot     28,30,32
    9 right foot    27,29,31
    10 left hand    16,18,20
    11 right hand   15,17,19
    12 left thumb   22
    13 left index   20
    14 left pinky   18
    15 right thumb  21
    16 right index  19
    17 right pinky  17
    18 torso        11,12,23,24
    19 head         0
    20 nose         0
    21 mouth        9,10
    22 left ear     8
    23 right ear    7
    24 left eye     5
    25 right eye    2
    */
    let h = [
      -110, -180, 110, 180, -50, -50, 50, 50, -70, 70, -180, 180, -159, -170,
      -200, 159, 170, 200, 0, 0, 0, 0, 50, -50, 20, -20,
    ];
    let k = [
      -110, -180, -110, -180, 110, 240, 110, 240, 315, 315, -265, -265, -277,
      -295, -285, -277, -295, -285, -30, -180, -175, -155, -180, -180, -190,
      -190,
    ];
    let rx = [
      65, 25, 65, 25, 25, 25, 25, 25, 65, 65, 17.5, 17.5, 10, 10, 10, 10, 10,
      10, 75, 45, 10, 40, 5, 5, 10, 10,
    ];
    let ry = [
      25, 65, 25, 65, 65, 65, 65, 65, 25, 25, 17.5, 17.5, 25, 30, 25, 25, 30,
      25, 100, 45, 15, 10, 12.5, 12.5, 10, 10,
    ];

    p5.preload = () => {
      myFont = p5.loadFont(Inconsolata);
      torso = p5.loadModel(torsoURL, true);
      head = p5.loadModel(headURL, true);
      larm1 = p5.loadModel(larm1URL, true);
      larm2 = p5.loadModel(larm2URL, true);
      lfoot = p5.loadModel(lfootURL, true);
      lhand = p5.loadModel(lhandURL, true);
      lleg1 = p5.loadModel(lleg1URL, true);
      lleg2 = p5.loadModel(lleg2URL, true);
      rarm1 = p5.loadModel(rarm1URL, true);
      rarm2 = p5.loadModel(rarm2URL, true);
      rfoot = p5.loadModel(rfootURL, true);
      rhand = p5.loadModel(rhandURL, true);
      rleg1 = p5.loadModel(rleg1URL, true);
      rleg2 = p5.loadModel(rleg2URL, true);
    };

    p5.setup = () => {
      p5.createCanvas(500, 800, p5.WEBGL);
    };

    p5.draw = () => {
      p5.background(220);

      p5.fill("black");
      p5.textFont(myFont);
      p5.strokeWeight(5);
      p5.textSize(100);
      p5.text("L", 110, -300);
      p5.text("R", -150, -300);

      p5.normalMaterial();
      p5.rotateX(p5.PI / 2);

      // torso
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(0, 0, 50 + offset);
      p5.scale(1.5);
      p5.model(torso);
      p5.pop();
      // head
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(0, 0, 250 + offset);
      p5.scale(0.5);
      p5.model(head);
      p5.pop();
      // right arm 1
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(86, 0, 92 + offset);
      p5.scale(0.75);
      p5.model(larm1);
      p5.pop();
      // right arm 2
      p5.push();
      p5.translate(-95, -10, -40 + offset);
      p5.scale(0.6);
      p5.model(rarm2);
      p5.pop();
      // right hand
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(103, 0, -45);
      p5.scale(0.35);
      p5.model(lhand);
      p5.pop();
      // left arm 1
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(-86, 0, 92 + offset);
      p5.scale(0.75);
      p5.model(rarm1);
      p5.pop();
      // left arm 2
      p5.push();
      p5.translate(95, -10, -40 + offset);
      p5.scale(0.6);
      p5.model(larm2);
      p5.pop();
      // left hand
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(-103, 0, -45);
      p5.scale(0.35);
      p5.model(rhand);
      p5.pop();
      // left leg 1
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(-42, 0, -158 + offset);
      p5.scale(1);
      p5.model(rleg1);
      p5.pop();
      // right leg 1
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(42, 0, -158 + offset);
      p5.scale(1);
      p5.model(lleg1);
      p5.pop();
      // right leg 2
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(35, 30, -340 + offset);
      p5.scale(0.8);
      p5.model(lleg2);
      p5.pop();
      // left leg 2
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(-35, 30, -340 + offset);
      p5.scale(0.8);
      p5.model(rleg2);
      p5.pop();
      // right foot
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(40, 35, -450 + offset);
      p5.scale(0.6);
      p5.model(lfoot);
      p5.pop();
      // left foot
      p5.push();
      p5.rotateZ(p5.PI);
      p5.translate(-40, 35, -450 + offset);
      p5.scale(0.6);
      p5.model(rfoot);
      p5.pop();
    };

    p5.mouseClicked = () => {
      let x = 300 - p5.mouseX;
      let y = p5.mouseY - 350;
      let indecies = [20, 21, 24, 25];
      let hval,
        hbool = true;
      let value,
        temp = [];
      const reducer = (accumulator, curr) => accumulator + curr;
      for (let i = 0; i < h.length; i++) {
        //https://math.stackexchange.com/questions/76457/check-if-a-point-is-within-an-ellipse
        value = (x - h[i]) ** 2 / rx[i] ** 2 + (y - k[i]) ** 2 / ry[i] ** 2;
        if (i !== 19) if (value <= 1) bodypart[i] = !bodypart[i];
        if (i === 19) hval = value;
        if (indecies.includes(i)) temp.push(value);
      }
      if (hval <= 1 && temp.reduce(reducer) > 4) {
        for (let i = 0; i < temp.length; i++) {
          if (temp[i] <= 1) {
            hbool = false;
            break;
          }
        }
        if (hbool) bodypart[19] = !bodypart[19];
      }
      //console.log(bodypart);
    };
  }
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 1 }}>
        <ReactP5Wrapper sketch={sketch} />
      </div>
      <div style={{ flex: 1 }}>
        <Button
          variant="primary"
          onClick={() =>
            bodypart.includes(true)
              ? ((state = "pressed"), (values = track.map((x) => [])))
              : (state = "not pressed")
          }
        >
          Start
        </Button>
      </div>
      <div style={{ flex: 1 }}>
        <Button
          variant="primary"
          onClick={() => ((state = "not pressed"), console.log(values))}
        >
          Stop
        </Button>
      </div>
      <div style={{ flex: 1 }}>
        <ReactP5Wrapper sketch={sketch2} />
      </div>
    </div>
  );
}
