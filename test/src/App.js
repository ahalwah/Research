import React from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import sketch from "./sketch";

// function sketch(p5) {
//   p5.setup = () => p5.createCanvas(600, 400, p5.WEBGL);

//   p5.draw = () => {
//     p5.background(250);
//     p5.normalMaterial();
//     p5.push();
//     p5.rotateZ(p5.frameCount * 0.01);
//     p5.rotateX(p5.frameCount * 0.01);
//     p5.rotateY(p5.frameCount * 0.01);
//     p5.plane(100);
//     p5.pop();
//   };
// }

export default function App() {
  return (
    <div style={{ paddingLeft: 100 }}>
      <ReactP5Wrapper sketch={sketch} />
    </div>
  );
}
