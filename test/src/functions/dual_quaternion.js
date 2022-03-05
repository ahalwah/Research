import * as math from "mathjs";

export default function Dual_quat(matrix, q) {
  // translation vector
  const d = [matrix[0][3], matrix[1][3], matrix[2][3]];

  // quaternion
  const q1 = q[0];
  const q2 = q[1];
  const q3 = q[2];
  const q4 = q[3];

  // quaternion of homogeneous euler parameters of rotation
  const Q = [q1, q2, q3, q4];
  const Q1 = q1,
    Q2 = q2,
    Q3 = q3,
    Q4 = q4;

  // quaternion representing translation
  const holder = [
    [0, -d[2], d[1], d[0]],
    [d[2], 0, -d[0], d[1]],
    [-d[1], d[0], 0, d[2]],
    [-d[0], -d[1], -d[2], 0],
  ];
  var Q0 = math.multiply(math.multiply(0.5, holder), [[Q1], [Q2], [Q3], [Q4]]);
  Q0 = [Q0[0][0], Q0[1][0], Q0[2][0], Q0[3][0]];

  return { real: Q, dual: Q0 };
}

// export default function Translation(matrix, q) {
//   // translation vector
//   const d = [matrix[0][3], matrix[1][3], matrix[2][3]];

//   // quaternion
//   const q1 = q[0];
//   const q2 = q[1];
//   const q3 = q[2];
//   const q4 = q[3];
//   const S2 = q1 ** 2 + q2 ** 2 + q3 ** 2 + q4 ** 2;

//   // quaternion of homogeneous euler parameters of rotation
//   const Q1 = q1,
//     Q2 = q2,
//     Q3 = q3,
//     Q4 = q4;

//   // quaternion representing translation
//   const holder = [
//     [0, -d[2], d[1], d[0]],
//     [d[2], 0, -d[0], d[1]],
//     [-d[1], d[0], 0, d[2]],
//     [-d[0], -d[1], -d[2], 0],
//   ];
//   const Q0 = math.multiply(math.multiply(0.5, holder), [
//     [Q1],
//     [Q2],
//     [Q3],
//     [Q4],
//   ]);
//   const Q01 = Q0[0],
//     Q02 = Q0[1],
//     Q03 = Q0[2],
//     Q04 = Q0[3];

//   // retrieve translation vector d
//   const D = [
//     [(2 / S2) * (Q04 * Q1 - Q01 * Q4 + Q02 * Q3 - Q03 * Q2)],
//     [(2 / S2) * (Q04 * Q2 - Q02 * Q4 + Q03 * Q1 - Q01 * Q3)],
//     [(2 / S2) * (Q04 * Q3 - Q03 * Q4 + Q01 * Q2 - Q02 * Q1)],
//   ];

//   return D;
// }
