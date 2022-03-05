import * as math from "mathjs";
import { max } from "mathjs";
export default class Helper {
  // subtract two points
  diffPoint = (arr1, arr2) => {
    return [arr1[0] - arr2[0], arr1[1] - arr2[1], arr1[2] - arr2[2]];
  };
  // Dot product
  dot = (arr1, arr2) => {
    return arr1[0] * arr2[0] + arr1[1] * arr2[1] + arr1[2] * arr2[2];
  };
  // magnitude of a vector
  mag = (v1) => {
    return math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
  };
  // normalize a vector
  normalize = (v) => {
    if (v[0] === 0 && v[1] === 0 && v[2] === 0) return [0, 0, 0];
    else return [v[0] / this.mag(v), v[1] / this.mag(v), v[2] / this.mag(v)];
  };
  // Cross product
  cross = (a, b) => {
    const i = a[1] * b[2] - a[2] * b[1];
    const j = a[2] * b[0] - a[0] * b[2];
    const k = a[0] * b[1] - a[1] * b[0];
    return [i, j, k];
  };
  // multiply quaternions
  multiply = (arg1, arg2) => {
    let result = [0, 0, 0, 0];
    result[0] =
      arg1[3] * arg2[0] +
      arg2[3] * arg1[0] +
      arg1[1] * arg2[2] -
      arg1[2] * arg2[1];
    result[1] =
      arg1[3] * arg2[1] +
      arg2[3] * arg1[1] +
      arg1[2] * arg2[0] -
      arg1[0] * arg2[2];
    result[2] =
      arg1[3] * arg2[2] +
      arg2[3] * arg1[2] +
      arg1[0] * arg2[1] -
      arg1[1] * arg2[0];
    result[3] =
      arg1[3] * arg2[3] -
      (arg1[0] * arg2[0] + arg1[1] * arg2[1] + arg1[2] * arg2[2]);
    return result;
  };
  planarDualQuaternion = (Phand, PhandTip, PhandThumb) => {
    const u = math.subtract(PhandTip, Phand);
    const v = math.subtract(PhandThumb, Phand);
    const j = math.divide(u, this.mag(u));
    const k = this.cross(j, math.divide(v, this.mag(v)));
    const i = this.cross(j, k);
    const I = [1, 0, 0],
      J = [0, 1, 0],
      K = [0, 0, 1];
    const d1 = Phand[0],
      d2 = Phand[1];
    const H = [
      [math.dot(I, i), math.dot(I, j), 0, d1],
      [math.dot(J, i), math.dot(J, j), 0, d2],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    // rotation about Z in XY plane
    // atan2(r21/r11)
    const theta = math.atan2(math.dot(J, i), math.dot(I, i));
    // dual quaternion
    const Z1 = (d1 / 2) * math.cos(theta / 2) + (d2 / 2) * math.sin(theta / 2);
    const Z2 = (-d1 / 2) * math.sin(theta / 2) + (d2 / 2) * math.cos(theta / 2);
    const Z3 = math.sin(theta / 2);
    const Z4 = math.cos(theta / 2);
    const Zrotation = [0, 0, Z3, Z4],
      Ztranslation = [Z1, Z2, 0, 0];

    return { real: Zrotation, dual: Ztranslation };
  };
  spatialDualQuaternion = (Phand, PhandTip, PhandThumb) => {
    const u = math.subtract(PhandTip, Phand);
    const v = math.subtract(PhandThumb, Phand);
    const j = math.divide(u, this.mag(u));
    const k = this.cross(j, math.divide(v, this.mag(v)));
    const i = this.cross(j, k);
    const I = [1, 0, 0],
      J = [0, 1, 0],
      K = [0, 0, 1];
    const d1 = Phand[0],
      d2 = Phand[1],
      d3 = Phand[2];
    const T = [
      [math.dot(I, i), math.dot(I, j), math.dot(I, k), d1],
      [math.dot(J, i), math.dot(J, j), math.dot(J, k), d2],
      [math.dot(K, i), math.dot(K, j), math.dot(K, k), d3],
      [0, 0, 0, 1],
    ];
    // calculate Q representing rotation part of dual quaternion
    const r11 = T[0][0],
      r12 = T[0][1],
      r13 = T[0][2],
      r21 = T[1][0],
      r22 = T[1][1],
      r23 = T[1][2],
      r31 = T[2][0],
      r32 = T[2][1],
      r33 = T[2][2];
    const t1 = [
      [1, 1, 1, 1],
      [1, -1, -1, 1],
      [-1, 1, -1, 1],
      [-1, -1, 1, 1],
    ];
    const t2 = [[r11], [r22], [r33], [1]];
    const sol = math.multiply(math.multiply(1 / 4, t1), t2);
    const max = math.max(sol);
    var q0, q1, q2, q3;
    if (max == sol[0][0]) {
      q0 = math.sqrt(sol[0][0]);
      q1 = (r32 - r23) / (4 * q0);
      q2 = (r13 - r31) / (4 * q0);
      q3 = (r21 - r12) / (4 * q0);
    }
    if (max == sol[1][0]) {
      q1 = math.sqrt(sol[1][0]);
      q0 = (r32 - r23) / (4 * q1);
      q2 = (r12 + r21) / (4 * q1);
      q3 = (r13 + r31) / (4 * q1);
    }
    if (max == sol[2][0]) {
      q2 = math.sqrt(sol[2][0]);
      q0 = (r13 - r31) / (4 * q2);
      q1 = (r12 + r21) / (4 * q2);
      q3 = (r23 + r32) / (4 * q2);
    }
    if (max == sol[3][0]) {
      q3 = math.sqrt(sol[3][0]);
      q0 = (r21 - r12) / (4 * q3);
      q1 = (r13 + r31) / (4 * q3);
      q2 = (r23 + r32) / (4 * q3);
    }
    // calculate Q0 representing translation part of dual quaternion
    const dMatrix = [
      [0, -d3, d2, d1],
      [d3, 0, -d1, d2],
      [-d2, d1, 0, d3],
      [-d1, -d2, -d3, 0],
    ];
    const qMatrix = [[q0], [q1], [q2], [q3]];
    const res = math.multiply(math.multiply(1 / 2, dMatrix), qMatrix);
    const Q0 = [res[0][0], res[1][0], res[2][0], res[3][0]];

    return { real: [q0, q1, q2, q3], dual: Q0 };
  };
  dFromDual = (dualQuaternion) => {
    const Q = dualQuaternion.real;
    const Q0 = dualQuaternion.dual;
    const Q1 = Q[0],
      Q2 = Q[1],
      Q3 = Q[2],
      Q4 = Q[3];
    const Q01 = Q0[0],
      Q02 = Q0[1],
      Q03 = Q0[2],
      Q04 = Q0[3];
    const S2 = Q1 ** 2 + Q2 ** 2 + Q3 ** 2 + Q4 ** 2;
    const matrix = [
      [Q04 * Q1 - Q01 * Q4 + Q02 * Q3 - Q03 * Q2],
      [Q04 * Q2 - Q02 * Q4 + Q03 * Q1 - Q01 * Q3],
      [Q04 * Q3 - Q03 * Q4 + Q01 * Q2 - Q02 * Q1],
    ];
    const d = math.multiply(2 / S2, matrix);

    return [d[0][0], d[1][0], d[2][0]];
  };
}
