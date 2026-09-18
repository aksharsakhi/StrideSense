/**
 * StrideSense TinyML Engine - Web In-Memory Inference
 * Bit-for-bit parity with firmware/StrideSense_Firmware/model_data.h and tinyml_infer.cpp
 */

export const ACTIVITY_NAMES = [
  "Standing",
  "Walking",
  "Running",
  "Sitting",
  "Fall"
];

export const ACTIVITY_COLORS = {
  Standing: '#06b6d4', // Cyan
  Walking: '#10b981',  // Emerald
  Running: '#8b5cf6',  // Purple
  Sitting: '#64748b',  // Slate
  Fall: '#ef4444'      // Red alert
};

// Tree 0
function evaluateTree0(f) {
  if (f[22] <= 598.78) { // heel_force_mean
    if (f[15] <= 197.11295) { // svm_gyro_mean
      if (f[13] <= 1.40230) { // svm_acc_max
        if (f[0] <= 0.44469) return 3; // Sitting
        else return 4; // Fall
      } else {
        if (f[3] <= 0.31003) return 4; // Fall
        else return 1; // Walking
      }
    } else {
      return 2; // Running
    }
  } else {
    if (f[16] <= 130.00928) { // svm_gyro_max
      if (f[12] <= 1.00507) { // svm_acc_mean
        if (f[23] <= 711.72) { // forefoot_force_mean
          if (f[11] <= 0.75378) return 4; // Fall
          else return 0; // Standing
        } else {
          if (f[21] <= 0.49764) { // medial_lateral_ratio
            if (f[22] <= 1533.94) return 4; // Fall
            else return 0; // Standing
          } else {
            return 0; // Standing
          }
        }
      } else {
        if (f[11] <= 0.86269) { // gyro_z_std
          if (f[13] <= 1.07958) { // svm_acc_max
            if (f[7] <= 1.29471) return 0; // Standing
            else return 4; // Fall
          } else {
            return 0; // Standing
          }
        } else {
          if (f[4] <= 1.00408) return 4; // Fall
          else {
            if (f[10] <= 0.04550) return 0; // Standing
            else {
              if (f[19] <= 2714.0) return 4; // Fall
              else return 0; // Standing
            }
          }
        }
      }
    } else {
      return 4; // Fall
    }
  }
}

// Tree 1
function evaluateTree1(f) {
  if (f[11] <= 47.03712) { // gyro_z_std
    if (f[9] <= 91.75208) { // gyro_y_std
      if (f[22] <= 213.34) { // heel_force_mean
        return 3; // Sitting
      } else {
        if (f[12] <= 0.98475) return 4; // Fall
        else {
          if (f[8] <= 3.50984) { // gyro_y_mean
            if (f[12] <= 1.00453) return 0; // Standing
            else {
              if (f[11] <= 0.95963) return 0; // Standing
              else return 4; // Fall
            }
          } else {
            return 4; // Fall
          }
        }
      }
    } else {
      if (f[22] <= 582.53) return 1; // Walking
      else return 4; // Fall
    }
  } else {
    return 2; // Running
  }
}

// Tree 2
function evaluateTree2(f) {
  if (f[11] <= 11.59991) { // gyro_z_std
    if (f[9] <= 1.01201) { // gyro_y_std
      if (f[13] <= 1.00013) return 4; // Fall
      else return 3; // Sitting
    } else {
      if (f[8] <= 0.51170) { // gyro_y_mean
        if (f[3] <= 0.03503) { // acc_y_std
          if (f[11] <= 0.93317) {
            if (f[5] <= 0.04744) return 0; // Standing
            else {
              if (f[17] <= 2770.85) return 4; // Fall
              else return 0; // Standing
            }
          } else {
            if (f[3] <= 0.03025) return 0; // Standing
            else {
              if (f[9] <= 1.42103) return 4; // Fall
              else return 0; // Standing
            }
          }
        } else {
          if (f[10] <= 0.06050) return 0; // Standing
          else {
            if (f[20] <= 1.12611) return 0; // Standing
            else return 4; // Fall
          }
        }
      } else {
        if (f[15] <= 2.03166) return 0; // Standing
        else return 4; // Fall
      }
    }
  } else {
    if (f[13] <= 2.67345) return 1; // Walking
    else return 2; // Running
  }
}

// Tree 3
function evaluateTree3(f) {
  if (f[3] <= 0.92328) { // acc_y_std
    if (f[19] <= 3987.5) { // force_total_max
      if (f[17] <= 633.08) { // force_total_mean
        return 3; // Sitting
      } else {
        if (f[2] <= 0.06946) { // acc_y_mean
          if (f[17] <= 1379.79) return 1; // Walking
          else {
            if (f[20] <= 1.31275) return 0; // Standing
            else {
              if (f[6] <= -0.04510) return 4; // Fall
              else return 0; // Standing
            }
          }
        } else {
          return 4; // Fall
        }
      }
    } else {
      if (f[13] <= 2.76295) return 1; // Walking
      else {
        if (f[13] <= 4.28785) return 2; // Running
        else return 4; // Fall
      }
    }
  } else {
    return 2; // Running
  }
}

// Tree 4
function evaluateTree4(f) {
  if (f[17] <= 633.08) { // force_total_mean
    return 3; // Sitting
  } else {
    if (f[11] <= 11.43052) { // gyro_z_std
      if (f[0] <= 0.06455) { // acc_x_mean
        if (f[12] <= 1.01507) { // svm_acc_mean
          if (f[10] <= 0.30460) { // gyro_z_mean
            if (f[19] <= 2416.0) {
              if (f[19] <= 2390.5) return 0; // Standing
              else return 4; // Fall
            } else {
              return 0; // Standing
            }
          } else {
            return 4; // Fall
          }
        } else {
          return 4; // Fall
        }
      } else {
        return 4; // Fall
      }
    } else {
      if (f[14] <= 0.67323) return 1; // Walking
      else return 2; // Running
    }
  }
}

// Tree 5
function evaluateTree5(f) {
  if (f[13] <= 1.46672) { // svm_acc_max
    if (f[7] <= 1.04968) { // gyro_x_std
      if (f[19] <= 1483.0) return 3; // Sitting
      else return 4; // Fall
    } else {
      if (f[10] <= 0.10290) { // gyro_z_mean
        if (f[14] <= 0.04937) {
          if (f[17] <= 1922.63) return 4; // Fall
          else return 0; // Standing
        } else {
          return 4; // Fall
        }
      } else {
        if (f[8] <= 0.43080) { // gyro_y_mean
          if (f[21] <= 2.13990) {
            if (f[4] <= 1.01116) return 0; // Standing
            else return 4; // Fall
          } else {
            return 0; // Standing
          }
        } else {
          return 4; // Fall
        }
      }
    }
  } else {
    if (f[19] <= 5933.5) { // force_total_max
      if (f[11] <= 51.05316) return 1; // Walking
      else return 2; // Running
    } else {
      if (f[12] <= 1.66043) {
        if (f[5] <= 0.52764) return 1; // Walking
        else return 4; // Fall
      } else {
        return 2; // Running
      }
    }
  }
}

// Tree 6
function evaluateTree6(f) {
  if (f[16] <= 96.87159) { // svm_gyro_max
    if (f[23] <= 468.47) { // forefoot_force_mean
      return 3; // Sitting
    } else {
      if (f[9] <= 0.82944) return 4; // Fall
      else {
        if (f[20] <= 1.07211) return 0; // Standing
        else {
          if (f[20] <= 1.08216) return 4; // Fall
          else {
            if (f[21] <= 2.13777) {
              if (f[22] <= 794.28) return 4; // Fall
              else return 0; // Standing
            } else {
              return 4; // Fall
            }
          }
        }
      }
    }
  } else {
    if (f[7] <= 29.26570) return 1; // Walking
    else {
      if (f[11] <= 30.77182) return 4; // Fall
      else return 2; // Running
    }
  }
}

// Tree 7
function evaluateTree7(f) {
  if (f[15] <= 83.74666) { // svm_gyro_mean
    if (f[7] <= 1.01393) { // gyro_x_std
      if (f[21] <= 0.56220) return 4; // Fall
      else return 3; // Sitting
    } else {
      if (f[2] <= 0.04664) { // acc_y_mean
        if (f[10] <= 0.30720) { // gyro_z_mean
          if (f[1] <= 0.03488) { // acc_x_std
            if (f[11] <= 0.72977) {
              if (f[3] <= 0.02998) return 4; // Fall
              else return 0; // Standing
            } else {
              return 0; // Standing
            }
          } else {
            return 0; // Standing
          }
        } else {
          return 4; // Fall
        }
      } else {
        return 4; // Fall
      }
    }
  } else {
    if (f[14] <= 0.67220) return 1; // Walking
    else {
      if (f[19] <= 10533.0) return 2; // Running
      else return 4; // Fall
    }
  }
}

/**
 * Extract 24 features from window of sensor samples
 * @param {Array<{ax, ay, az, gx, gy, gz, p1, p2, p3, p4, p5, p6}>} window
 * @returns {Float32Array} 24-element feature vector
 */
export function extractFeatures(window) {
  const N = window.length;
  if (N === 0) return new Float32Array(24);

  let sum_ax = 0, sum_ay = 0, sum_az = 0;
  let sum_gx = 0, sum_gy = 0, sum_gz = 0;
  let sum_svm_acc = 0, max_svm_acc = 0;
  let sum_svm_gyro = 0, max_svm_gyro = 0;
  let sum_force = 0, max_force = 0;
  let sum_heel = 0, sum_forefoot = 0;
  let sum_medial = 0, sum_lateral = 0;

  for (let i = 0; i < N; i++) {
    const s = window[i];
    sum_ax += s.ax;
    sum_ay += s.ay;
    sum_az += s.az;

    sum_gx += s.gx;
    sum_gy += s.gy;
    sum_gz += s.gz;

    const svm_a = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az);
    sum_svm_acc += svm_a;
    if (svm_a > max_svm_acc) max_svm_acc = svm_a;

    const svm_g = Math.sqrt(s.gx * s.gx + s.gy * s.gy + s.gz * s.gz);
    sum_svm_gyro += svm_g;
    if (svm_g > max_svm_gyro) max_svm_gyro = svm_g;

    const forefoot = (s.p2 || s.p5 || 0);
    const f_tot = s.p1 + forefoot;
    sum_force += f_tot;
    if (f_tot > max_force) max_force = f_tot;

    const h = s.p1;
    const ff = forefoot;
    const med = forefoot * 0.52;
    const lat = forefoot * 0.48;

    sum_heel += h;
    sum_forefoot += ff;
    sum_medial += med;
    sum_lateral += lat;
  }

  const mean_ax = sum_ax / N;
  const mean_ay = sum_ay / N;
  const mean_az = sum_az / N;
  const mean_gx = sum_gx / N;
  const mean_gy = sum_gy / N;
  const mean_gz = sum_gz / N;
  const mean_svm_acc = sum_svm_acc / N;
  const mean_svm_gyro = sum_svm_gyro / N;
  const mean_force = sum_force / N;
  const mean_heel = sum_heel / N;
  const mean_forefoot = sum_forefoot / N;
  const mean_medial = sum_medial / N;
  const mean_lateral = sum_lateral / N;

  let var_ax = 0, var_ay = 0, var_az = 0;
  let var_gx = 0, var_gy = 0, var_gz = 0;
  let var_svm_acc = 0, var_force = 0;

  for (let i = 0; i < N; i++) {
    const s = window[i];
    var_ax += (s.ax - mean_ax) * (s.ax - mean_ax);
    var_ay += (s.ay - mean_ay) * (s.ay - mean_ay);
    var_az += (s.az - mean_az) * (s.az - mean_az);

    var_gx += (s.gx - mean_gx) * (s.gx - mean_gx);
    var_gy += (s.gy - mean_gy) * (s.gy - mean_gy);
    var_gz += (s.gz - mean_gz) * (s.gz - mean_gz);

    const svm_a = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az);
    var_svm_acc += (svm_a - mean_svm_acc) * (svm_a - mean_svm_acc);

    const f_tot = (s.p1 + s.p2 + s.p3 + s.p4 + s.p5 + s.p6);
    var_force += (f_tot - mean_force) * (f_tot - mean_force);
  }

  const f = new Float32Array(24);
  f[0]  = mean_ax;
  f[1]  = Math.sqrt(var_ax / N);
  f[2]  = mean_ay;
  f[3]  = Math.sqrt(var_ay / N);
  f[4]  = mean_az;
  f[5]  = Math.sqrt(var_az / N);

  f[6]  = mean_gx;
  f[7]  = Math.sqrt(var_gx / N);
  f[8]  = mean_gy;
  f[9]  = Math.sqrt(var_gy / N);
  f[10] = mean_gz;
  f[11] = Math.sqrt(var_gz / N);

  f[12] = mean_svm_acc;
  f[13] = max_svm_acc;
  f[14] = Math.sqrt(var_svm_acc / N);

  f[15] = mean_svm_gyro;
  f[16] = max_svm_gyro;

  f[17] = mean_force;
  f[18] = Math.sqrt(var_force / N);
  f[19] = max_force;

  f[20] = mean_heel / (mean_forefoot + 1.0);
  f[21] = mean_medial / (mean_lateral + 1.0);
  f[22] = mean_heel;
  f[23] = mean_forefoot;

  return f;
}

/**
 * Run 8-tree Random Forest inference on feature vector
 * @param {Float32Array} features 
 * @returns {{activity: number, activityName: string, confidence: number, votes: number[]}}
 */
export function runTinyMLInference(features) {
  const votes = [0, 0, 0, 0, 0];
  const treeResults = [
    evaluateTree0(features),
    evaluateTree1(features),
    evaluateTree2(features),
    evaluateTree3(features),
    evaluateTree4(features),
    evaluateTree5(features),
    evaluateTree6(features),
    evaluateTree7(features)
  ];

  for (const treeClass of treeResults) {
    votes[treeClass]++;
  }

  let maxVotes = -1;
  let bestClass = 0;
  for (let c = 0; c < 5; c++) {
    if (votes[c] > maxVotes) {
      maxVotes = votes[c];
      bestClass = c;
    }
  }

  const confidence = maxVotes / 8.0;

  return {
    activity: bestClass,
    activityName: ACTIVITY_NAMES[bestClass],
    confidence,
    votes,
    treeResults
  };
}
