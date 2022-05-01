import * as math from "mathjs";
export default class Helper {
  //euler angles from rotation matrix
  eulerAngles(matrix) {
    const r32 = matrix[2][1];
    const r33 = matrix[2][2];
    const r31 = matrix[2][0];
    const r21 = matrix[1][0];
    const r11 = matrix[0][0];
    const thetax = math.atan2(r32, r33);
    const thetay = math.atan2(-r31, math.sqrt(r32 ** 2 + r33 * 2));
    const thetaz = math.atan2(r21, r11);
    return [thetax, thetay, thetaz];
  }
  // distance between two points
  distance(point1, point2) {
    return math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
  }
  // map
  map(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  }
  // midpoint
  midpoint(part1, part2) {
    return {
      x: (part1.x + part2.x) / 2,
      y: (part1.y + part2.y) / 2,
      z: (part1.z + part2.z) / 2,
    };
  }
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
    return math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2);
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
  Homogenous_Matrix(P1, P2) {
    // P1 = Pchild, P2 = Pparent

    // Initial position of limb
    const Vinitial = [0, 1, 0];
    // Final position of limb
    const Vfinal = this.normalize(math.subtract(P1, P2)); //Pchild - Pparent

    // unit axis of rotation (normalized)
    const s = this.normalize(math.cross(Vinitial, Vfinal));

    // angle of rotation in radians
    // const theta = math.acos(
    //   (-1 * this.dot(Vinitial, Vfinal)) /
    //     (this.mag(Vinitial) * this.mag(Vfinal))
    // );
    const theta = math.acos(math.dot(Vinitial, Vfinal));
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
    const d = P2;

    // homogeneous matrix
    const H = [
      [R11, R12, R13, d[0]],
      [R21, R22, R23, d[1]],
      [R31, R32, R33, d[2]],
      [0, 0, 0, 1],
    ];

    return H;
  }
  quaternion(P1, P2) {
    // P1 = Pchild, P2 = Pparent

    // Initial position of limb
    const Vinitial = [0, 1, 0];
    // Final position of limb
    const Vfinal = this.normalize(math.subtract(P1, P2));

    // unit axis of rotation (normalized)
    const s = this.normalize(math.cross(Vinitial, Vfinal));

    // angle of rotation in radians
    // const theta = math.acos(
    //   (-1 * this.dot(Vinitial, Vfinal)) /
    //     (this.mag(Vinitial) * this.mag(Vfinal))
    // );
    const theta = math.acos(math.dot(Vinitial, Vfinal));
    // console.log((theta * 180) / math.pi);

    // Euler Rodrigues Parameters
    const q1 = s[0] * math.sin(theta / 2);
    const q2 = s[1] * math.sin(theta / 2);
    const q3 = s[2] * math.sin(theta / 2);
    const q4 = math.cos(theta / 2);

    return [q1, q2, q3, q4];
  }
  dualQuaternion(P1, P2) {
    // P1 = Pchild, P2 = Pparent
    // quaternion
    const q = this.quaternion(P1, P2);

    // homogenous matrix
    const matrix = this.Homogenous_Matrix(P1, P2);

    // position vector
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
    var Q0 = math.multiply(math.multiply(0.5, holder), [
      [Q1],
      [Q2],
      [Q3],
      [Q4],
    ]);
    Q0 = [Q0[0][0], Q0[1][0], Q0[2][0], Q0[3][0]];

    return { real: Q, dual: Q0 };
  }
  // for hand
  planarDualQuaternion = (Phand, PhandTip) => {
    let PhandThumb = [
      -(PhandTip[1] - Phand[1]) + Phand[0],
      PhandTip[0] - Phand[0] + Phand[1],
      0,
    ];
    const u = math.subtract(PhandTip, Phand);
    // console.log(PhandTip + " " + Phand + " " + PhandThumb);
    const v = math.subtract(PhandThumb, Phand);
    const j = math.divide(u, this.mag(u));
    const k = this.cross(j, math.divide(v, this.mag(v)));
    const i = this.cross(j, k);
    const I = [-1, 0, 0],
      J = [0, 1, 0];
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
  // for hand
  spatialDualQuaternion = (Phand, PhandTip, PhandThumb) => {
    Phand = this.normalize(Phand);
    PhandTip = this.normalize(PhandTip);
    PhandThumb = this.normalize(PhandThumb);
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
  rFromDual = (dualQuaternion) => {
    const real = dualQuaternion.real;
    // euler rodrigues parameters
    const q1 = real[0],
      q2 = real[1],
      q3 = real[2],
      q4 = real[3];
    // parameters squared
    const q12 = q1 ** 2,
      q22 = q2 ** 2,
      q32 = q3 ** 2,
      q42 = q4 ** 2;

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

    const rotMatrix = [
      [R11, R12, R13],
      [R21, R22, R23],
      [R31, R32, R33],
    ];
    return rotMatrix;
  };
  rationalScrew(dualQuatArray, resolution) {
    let result = [];
    for (let i = 0; i < dualQuatArray.length - 1; i++) {
      const real1 = dualQuatArray[i].real,
        dual1 = dualQuatArray[i].dual;
      const real2 = dualQuatArray[i + 1].real,
        dual2 = dualQuatArray[i + 1].dual;
      for (let t = 0; t <= 1; t += resolution) {
        let term1 = math.multiply(1 - t, real1),
          term2 = math.multiply(t, real2);
        const realResult = math.add(term1, term2);
        let term11 = math.multiply(1 - t, dual1),
          term22 = math.multiply(t, dual2);
        const dualResult = math.add(term11, term22);
        result.push({ real: realResult, dual: dualResult });
      }
    }
    return result;
  }
  rationalScrewJoints(position, resolution) {
    let result = [];
    let nJoints = position[0].joints.length;
    for (let j = 0; j < nJoints; j++) {
      let temp = [];
      for (let i = 0; i < position.length - 1; i++) {
        let jointP1 = position[i].joints[j].position;
        let jointP2 = position[i + 1].joints[j].position;
        for (let t = 0; t <= 1; t += resolution) {
          let term1 = math.multiply(1 - t, jointP1);
          let term2 = math.multiply(t, jointP2);
          temp.push(math.add(term1, term2));
        }
      }
      result.push(temp);
    }
    return result;
  }
  rationalScrewLimbs(position, resolution) {
    let result = [];
    let nLimbs = position[0].limbs.length;
    for (let j = 0; j < nLimbs; j++) {
      let temp = [];
      for (let i = 0; i < position.length - 1; i++) {
        const real1 = position[i].joints[j].dualQuaternion.real,
          dual1 = position[i].joints[j].dualQuaternion.dual;
        const real2 = position[i + 1].joints[j].dualQuaternion.real,
          dual2 = position[i + 1].joints[j].dualQuaternion.dual;
        for (let t = 0; t <= 1; t += resolution) {
          let term1 = math.multiply(1 - t, real1),
            term2 = math.multiply(t, real2);
          const realResult = math.add(term1, term2);
          let term11 = math.multiply(1 - t, dual1),
            term22 = math.multiply(t, dual2);
          const dualResult = math.add(term11, term22);
          temp.push({ real: realResult, dual: dualResult });
        }
      }
      result.push(temp);
    }
    return result;
  }
  factorial(n) {
    if (n == 1 || n == 0) return 1;
    else {
      let res = 1;
      for (let i = n; i > 0; i--) {
        res *= i;
      }
      return res;
    }
  }
  binomial(n, k) {
    let nf = this.factorial(n);
    let kf = this.factorial(k);
    let nkf = this.factorial(n - k);

    return nf / (kf * nkf);
  }
  rationalBezier(dualQuatArray, resolution) {
    let result = [];
    let n = dualQuatArray.length;
    for (let t = 0; t <= 1; t += resolution) {
      let sumReal = [0, 0, 0, 0],
        sumDual = [0, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        const real = dualQuatArray[i].real,
          dual = dualQuatArray[i].dual;
        let bern = this.binomial(n - 1, i) * t ** i * (1 - t) ** (n - 1 - i);
        sumReal = math.add(sumReal, math.multiply(bern, real));
        sumDual = math.add(sumDual, math.multiply(bern, dual));
      }
      result.push({ real: sumReal, dual: sumDual });
    }
    return result;
  }
  rationalBezierJoints(position, resolution) {
    let result = [];
    let n = position.length;
    let nJoints = position[0].joints.length;
    for (let j = 0; j < nJoints; j++) {
      let temp = [];
      for (let t = 0; t <= 1; t += resolution) {
        let sum = [0, 0, 0];
        for (let i = 0; i < n; i++) {
          let jointP = position[i].joints[j].position;
          let bern = this.binomial(n - 1, i) * t ** i * (1 - t) ** (n - 1 - i);
          sum = math.add(sum, math.multiply(bern, jointP));
        }
        temp.push(sum);
      }
      result.push(temp);
    }
    return result;
  }
  FindSpan(n, p, u, U) {
    // returns knot span index
    // p: degree of curve
    // U: knot vector
    // n: number of control points

    //Special case where u = u(m)
    if (u == U[n + 1]) return n;

    //Do binary search
    let high = n + 1;
    let low = p;
    let mid = math.floor((low + high) / 2);
    while (u < U[mid] || u >= U[mid + 1]) {
      if (u < U[mid]) high = mid;
      else low = mid;
      mid = math.floor((low + high) / 2);
    }
    return mid;
  }
  BasisFuns(i, u, p, U) {
    // compute basis function
    // N: basis function
    // i: span index
    let N = [];
    N[0] = 1.0;
    let left = [];
    let right = [];
    for (let j = 1; j <= p; j++) {
      left[j] = u - U[i + 1 - j];
      right[j] = U[i + j] - u;
      let saved = 0.0;
      for (let r = 0; r < j; r++) {
        let temp = N[r] / (right[r + 1] + left[j - r]);
        N[r] = saved + right[r + 1] * temp;
        saved = left[j - r] * temp;
      }
      N[j] = saved;
    }
    return N;
  }
  bSpline(dualQuatArray, p, resolution) {
    // p = degree
    let result = [];
    const n = dualQuatArray.length - 1;
    const m = n + p + 1;
    // define knot vector
    let U = [];
    let knot = 0;
    for (let i = 0; i <= m; i++) {
      U.push(knot);
      if (i >= p && i < m - p) knot++;
    }

    for (let u = U[p]; u < U[U.length - 1 - p]; u += resolution) {
      const i = this.FindSpan(n, p, u, U);
      const N = this.BasisFuns(i, u, p, U);
      let k = 0;
      let sumReal = [0, 0, 0, 0],
        sumDual = [0, 0, 0, 0];
      if (i - p >= 0)
        for (let I = i - p; I <= i; I++) {
          const Nip = N[k];
          const real = dualQuatArray[I].real,
            dual = dualQuatArray[I].dual;
          sumReal = math.add(sumReal, math.multiply(Nip, real));
          sumDual = math.add(sumDual, math.multiply(Nip, dual));
          k += 1;
        }
      result.push({ real: sumReal, dual: sumDual });
    }
    return result;
  }

  bSplineJoints(position, p, resolution) {
    // p = degree
    let result = [];
    const n = position.length - 1;
    const m = n + p + 1;
    // define knot vector
    let U = [];
    let knot = 0;
    for (let i = 0; i <= m; i++) {
      U.push(knot);
      if (i >= p && i < m - p) knot++;
    }

    let nJoints = position[0].joints.length;
    for (let j = 0; j < nJoints; j++) {
      let temp = [];
      for (let u = U[p]; u < U[U.length - 1 - p]; u += resolution) {
        const i = this.FindSpan(n, p, u, U);
        const N = this.BasisFuns(i, u, p, U);
        let k = 0;
        let sum = [0, 0, 0];
        if (i - p >= 0)
          for (let I = i - p; I <= i; I++) {
            const Nip = N[k];
            let jointP = position[I].joints[j].position;
            sum = math.add(sum, math.multiply(Nip, jointP));
            console.log(I + " " + jointP + " " + sum);
            k += 1;
          }
        temp.push(sum);
      }
      result.push(temp);
    }
    return result;
  }
  calcBiQuaternions(dualQuaternion, position) {
    const Phand = [position.Phand.x, position.Phand.y, position.Phand.z];
    const R = 10000;
    const d_hat = this.normalize(Phand); // unit vector along translation vector d
    const d = this.mag(Phand); // magnitude of translation vector Phand (dist from origin to hand)
    const denom = math.sqrt(4 * R ** 2 + d ** 2);
    const vector = math.multiply(d_hat, d / denom); // vector part of the quaternion
    const D = [(2 * R) / denom, vector[0], vector[1], vector[2]];
    const Ds = [D[0], -D[1], -D[2], -D[3]]; // conjugate of D
    const Q = dualQuaternion.real;
    const G = this.multiply(D, Q);
    const H = this.multiply(Ds, Q);

    return { G: G, H: H };
  }
}
