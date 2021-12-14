import React from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import Inconsolata from "./font/Inconsolata-Black.otf";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl"; // for tfjs

export default function App() {
  var bodypart = new Array(26).fill(false);

  function sketch2(p) {
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
      // handle rejection (TypeError)
      try {
        poses = await detector.estimatePoses(video.elt);
      } catch (error) {
        console.log(detector);
        await init();
      }

      setTimeout(getPoses, 0);
    }

    // x,y of chosen joints for drawing

    // use keypoint3d to get -1 to 1 meters
    // orientation of limbs (angle) degrees
    // velocity of limbs m/s
    // acceleration of limbs m/s

    p.draw = function () {
      let time;
      p.background(220);
      p.image(video, 0, 0);
      if (poses && poses.length > 0) {
        // for (var i = 0; i < poses[0].keypoints.length; i++) {
        time = new Date().getTime();
        //   let x = poses[0].keypoints[i].x;
        //   let y = poses[0].keypoints[i].y;
        //   let z = mapping(poses[0].keypoints3D[i].z, -1, 1, 0, 2);

        let track = [];
        if (bodypart[0]) track = [12, 14];
        if (bodypart[1]) track = [14, 16];
        if (bodypart[2]) track = [11, 13];
        if (bodypart[3]) track = [13, 15];
        if (bodypart[4]) track = [24, 26];
        if (bodypart[5]) track = [26, 28];
        if (bodypart[6]) track = [23, 25];
        if (bodypart[7]) track = [25, 27];
        if (bodypart[8]) track = [28, 30, 32];
        if (bodypart[9]) track = [27, 29, 31];
        if (bodypart[10]) track = [16, 18, 20];
        if (bodypart[11]) track = [15, 17, 19];
        if (bodypart[12]) track = [22];
        if (bodypart[13]) track = [20];
        if (bodypart[14]) track = [18];
        if (bodypart[15]) track = [21];
        if (bodypart[16]) track = [19];
        if (bodypart[17]) track = [17];
        if (bodypart[18]) track = [11, 12, 23, 24];
        if (bodypart[19]) track = [0];
        if (bodypart[20]) track = [0];
        if (bodypart[21]) track = [9, 10];
        if (bodypart[22]) track = [8];
        if (bodypart[23]) track = [7];
        if (bodypart[24]) track = [5];
        if (bodypart[25]) track = [2];

        // when button pressed
        let values = track.map((x) => []);
        //
        p.fill("#006400");
        if (track.length > 0)
          for (let i = 0; i < track.length; i++) {
            if (poses[0].keypoints[track[i]].score > 0.8)
              p.circle(
                poses[0].keypoints[track[i]].x,
                poses[0].keypoints[track[i]].y,
                20
              );
          }
        // recording
        for (let i = 0; i < track.length; i++) {
          values[i].push({
            x: poses[0].keypoints[track[i]].x,
            y: poses[0].keypoints[track[i]].y,
            time: time,
          });
        }
        //
      }
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

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 1 }}>
        <ReactP5Wrapper sketch={sketch} />
      </div>
      <div style={{ flex: 1 }}>
        <ReactP5Wrapper sketch={sketch2} />
      </div>
    </div>
  );
}
