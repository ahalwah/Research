const { spawn } = require("child_process");
const poses = []; // Store readings

const sensor = spawn("python", ["pose.py"]);
sensor.stdout.on("data", function (data) {
  // convert Buffer object to Float
  poses.push(parseFloat(data));
  console.log(poses);
});
