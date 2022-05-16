import * as math from "mathjs";

export default function Homogenous_Matrix(P1, P2, choice) {
  // P1 = Pchild, P2 = Pparent

  // Initial position of limb
  const Vinitial = [0, -1, 0];
  // Final position of limb
  const Vfinal = normalize(diffPoint(P1, P2));

  // unit axis of rtation (normalized)
  const s = normalize(cross(Vinitial, Vfinal));

  // angle of rotation in radians
  const theta = math.acos(
    (-1 * dot(Vinitial, Vfinal)) / (mag(Vinitial) * mag(Vfinal))
  );
  //console.log((theta * 180) / math.pi);

  // Euler Rodrigues Parameters
  const q1 = s[0] * math.sin(theta / 2);
  const q2 = s[1] * math.sin(theta / 2);
  const q3 = s[2] * math.sin(theta / 2);
  const q4 = math.cos(theta / 2);

  // Parameters Squared
  const q12 = q1 ** 2;
  const q22 = q2 ** 2;
  const q32 = q3 ** 2;
  const q42 = q4 ** 2;

  // Rotation Matrix [R]
  const S2 = q12 + q22 + q32 + q42;

  const R11 = (1 / S2) * (q42 + q12 - q22 - q32);
  const R12 = (2 / S2) * (q1 * q2 - q4 * q3);
  const R13 = (2 / S2) * (q1 * q3 + q4 * q2);
  const R21 = (2 / S2) * (q2 * q1 + q4 * q3);
  const R22 = (1 / S2) * (q42 - q12 + q22 - q32);
  const R23 = (2 / S2) * (q2 * q3 - q4 * q1);
  const R31 = (2 / S2) * (q3 * q1 - q4 * q2);
  const R32 = (2 / S2) * (q3 * q2 + q4 * q1);
  const R33 = (1 / S2) * (q42 - q12 - q22 + q32);

  // translation vector d
  const d = normalize(diffPoint(P2, [0, 0, 0]));

  // homogeneous matrix
  const H = [
    [R11, R12, R13, d[0]],
    [R21, R22, R23, d[1]],
    [R31, R32, R33, d[2]],
    [0, 0, 0, 1],
  ];

  switch (choice) {
    case 0:
      // homogenous transformation matrix
      return H;
    case 1:
      // quaternion
      return [q1, q2, q3, q4];
    case 2:
      // unit vector for axis of rotation
      return s;
  }
}

// subtract two points
const diffPoint = (arr1, arr2) => {
  return [arr1[0] - arr2[0], arr1[1] - arr2[1], arr1[2] - arr2[2]];
};
// Dot product
const dot = (arr1, arr2) => {
  return arr1[0] * arr2[0] + arr1[1] * arr2[1] + arr1[2] * arr2[2];
};
// magnitude of a vector
const mag = (v1) => {
  return math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
};
// normalize a vector
const normalize = (v) => {
  if (v[0] === 0 && v[1] === 0 && v[2] === 0) return [0, 0, 0];
  else return [v[0] / mag(v), v[1] / mag(v), v[2] / mag(v)];
};
// Cross product
const cross = (a, b) => {
  const i = a[1] * b[2] - a[2] * b[1];
  const j = a[2] * b[0] - a[0] * b[2];
  const k = a[0] * b[1] - a[1] * b[0];
  return [i, j, k];
};
