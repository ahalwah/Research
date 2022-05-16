import * as math from "mathjs";

export default function Translation(dualQuaternion) {
  // real
  const Q = dualQuaternion.real;
  const Q1 = Q[0],
    Q2 = Q[1],
    Q3 = Q[2],
    Q4 = Q[3];
  // dual
  const Q0 = dualQuaternion.dual;
  const Q01 = Q0[0],
    Q02 = Q0[1],
    Q03 = Q0[2],
    Q04 = Q[3];

  // translation
  const S2 = Q1 ** 2 + Q2 ** 2 + Q3 ** 2 + Q4 ** 2;
  const d = [
    (2 / S2) * (Q04 * Q1 - Q01 * Q4 + Q02 * Q3 - Q03 * Q2),
    (2 / S2) * (Q04 * Q2 - Q02 * Q4 + Q03 * Q1 - Q01 * Q3),
    (2 / S2) * (Q04 * Q3 - Q03 * Q4 + Q01 * Q2 - Q02 * Q1),
  ];

  // const QC = [-1 * Q1, -1 * Q2, -1 * Q3, Q4];
  // const Q0C = [-1 * Q01, -1 * Q02, -1 * Q03, Q04];
  // const t1 = multiply(Q0, QC);
  // const t2 = multiply(Q, Q0C);
  // const t3 = Q1 ** 2 + Q2 ** 2 + Q3 ** 2 + Q4 ** 2;
  // const D = math.divide(math.subtract(t1, t2), t3);

  return { x: d[0], y: d[1], z: d[2] };
}

function multiply(arg1, arg2) {
  let res = [];
  res.push(
    arg1[3] * arg2[0] +
      arg2[3] * arg1[0] +
      arg1[1] * arg2[2] -
      arg1[2] * arg2[1]
  );
  res.push(
    arg1[3] * arg2[1] +
      arg2[3] * arg1[1] +
      arg1[2] * arg2[0] -
      arg1[0] * arg2[2]
  );
  res.push(
    arg1[3] * arg2[2] +
      arg2[3] * arg1[2] +
      arg1[0] * arg2[1] -
      arg1[1] * arg2[0]
  );
  res.push(
    arg1[3] * arg2[3] -
      (arg1[0] * arg2[0] + arg1[1] * arg2[1] + arg1[2] * arg2[2])
  );
  return res;
}
