// Pawbie Eye Animation Demo - 表情系统 v0.3
// 基于 idle/pose + gazeBehavior + overlay 的可组合表情系统

// ============ 基础配置 ============
const config = {
  eyeSize: 240,           // 单眼尺寸
  eyeGap: 160,            // 两眼间隔（固定）
  canvasWidth: 720,       // 画布宽度
  canvasHeight: 400,      // 画布高度
  useImages: true,        // 启用图片图层
  useEllipseMask: true,   // 启用椭圆遮罩
  maskRadiusX: 0.4167,    // X方向半径比例 (2.5cm/3cm)
  maskRadiusY: 0.45,      // Y方向半径比例 (2.7cm/3cm)
  pupilMaxOffset: 30,     // 瞳孔最大偏移
  highlightFollow: 0.3    // 高光跟随系数
};

// ============ 预设值定义 ============

// GazeBehavior: 瞳孔跟随模式
const GAZE = {
  reverse: -1,    // 反向跟随
  none: 0,        // 不跟随
  follow: 1       // 正常跟随
};

// Duration: 过渡时长预设
const DURATION = {
  fast: 200,      // 快速
  normal: 400,    // 正常
  slow: 800       // 缓慢
};

// ============ idle 常态定义 ============
// idle 是基态，有 openPose 和 closePose，可以眨眼
const idle = {
  // 睁眼姿态（眼皮在画外）
  openPose: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    }
  },
  // 闭眼姿态（眨眼用）
  closePose: {
    left: {
      upper: { x: 0, y: 0, rot: 0 },
      lower: { x: 0, y: 69, rot: 0 }
    },
    right: {
      upper: { x: 0, y: 0, rot: 0 },
      lower: { x: 0, y: 69, rot: 0 }
    }
  },
  // 瞳孔
  pupil: {
    scale: 0.7,
    offset: { x: 0, y: 0 },
    pattern: 'neutral'
  },
  // idle 专属：眨眼策略
  blinkPolicy: 'slow',
  // idle 专属：gaze
  gaze: GAZE.follow,
  // 过渡时长
  duration: DURATION.normal
};

// ============ Pose 定义 ============
// pose 是表情姿态，从 idle.openPose 过渡，不眨眼
const poses = {
  happy: {
    left: {
      upper: { x: 0, y: -220, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -220, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    pupil: {
      scale: 0.75,
      offset: { x: 0, y: 0 },
      pattern: null
    },
    gaze: GAZE.none,
    overlay: 'happy_L',
    duration: DURATION.fast
  },

  happy2: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 120, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 120, rot: 0 }
    },
    pupil: {
      scale: 0.9,
      offset: { x: 0, y: 0 },
      pattern: 'calm'
    },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.fast,
    pupilAnimation: {
      type: 'keyframes',
      loop: true,
      keyframes: [
        { offset_x: 0, offset_y: -18, duration_ms: 600 },
        { offset_x: -22, offset_y: -12, duration_ms: 550 },
        { offset_x: 22, offset_y: -12, duration_ms: 550 },
        { offset_x: 0, offset_y: -10, duration_ms: 450 },
        { offset_x: 0, offset_y: 0, duration_ms: 500 }
      ]
    }
  },
  
  angry: {
    left: {
      upper: { x: 30, y: -140, rot: 0.35 },
      lower: { x: 0, y: 100, rot: 0 }
    },
    right: {
      upper: { x: -30, y: -140, rot: -0.35 },
      lower: { x: 0, y: 100, rot: 0 }
    },
    pupil: {
      scale: 0.6,
      offset: { x: 0, y: 0 },
      pattern: 'anxious'
    },
    gaze: GAZE.reverse,
    overlay: null,
    duration: DURATION.normal
  },
  
  sad: {
    left: {
      upper: { x: 0, y: -100, rot: -0.2 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -100, rot: 0.2 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    pupil: {
      scale: 0.65,
      offset: { x: 0, y: 15 },
      pattern: 'calm'
    },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  adore: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 120, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 120, rot: 0 }
    },
    pupil: {
      scale: 0.9,
      offset: { x: 0, y: 0 },
      pattern: 'calm'
    },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.fast
  },

  // ========== 喜爱类 ==========
  expectant: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.85, offset: { x: 0, y: 0 }, pattern: 'neutral' },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.normal
  },

  imprint: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 120, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 120, rot: 0 } },
    pupil: { scale: 0.95, offset: { x: 0, y: 0 }, pattern: 'neutral' },
    gaze: GAZE.follow,
    overlay: 'imprint_L',
    duration: DURATION.normal
  },

  // ========== 关心/忧虑类 ==========
  caring: {
    left: { upper: { x: 0, y: -150, rot: -0.1 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: 0.1 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 5 }, pattern: 'calm' },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.normal
  },

  worried: {
    left: { upper: { x: 0, y: -150, rot: -0.2 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: 0.2 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.6, offset: { x: 0, y: 10 }, pattern: 'anxious' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  // ========== 平静/发呆类 ==========
  calm: {
    left: { upper: { x: 0, y: -140, rot: 0.15 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -140, rot: -0.15 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 0 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  daze: {
    left: { upper: { x: 0, y: -100, rot: 0.15 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -100, rot: -0.15 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.65, offset: { x: 0, y: 0 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  // ========== 思考类 ==========
  confused: {
    left: { upper: { x: 0, y: -120, rot: -0.2}, lower: { x: 0, y: 110, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: 0.1 }, lower: { x: 0, y: 120, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 10, y: -5 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  thinking: {
    left: { upper: { x: 0, y: -140, rot: -0.1 }, lower: { x: 0, y: 120, rot: 0 } },
    right: { upper: { x: 0, y: -200, rot: 0 }, lower: { x: 0, y: 120, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 15, y: -15 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  curious: {
    left: { upper: { x: 15, y: -150, rot: 0.4 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.8, offset: { x: 15, y: -15 }, pattern: 'neutral' },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.fast
  },

  // ========== 享受/观察/放松 ==========
  enjoy: {
    left: { upper: { x: 0, y: -50, rot: 0.3 }, lower: { x: 0, y: 69, rot: 0.3 } },
    right: { upper: { x: 0, y: -50, rot: -0.3 }, lower: { x: 0, y: 69, rot: -0.3 } },
    pupil: { scale: 0.75, offset: { x: 0, y: 5 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  observe: {
    left: { upper: { x: 0, y: -100, rot: 0.15 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: 0, y: -100, rot: -0.15 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 0 }, pattern: 'neutral' },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.slow
  },

  relaxed: {
    left: { upper: { x: 0, y: -50, rot: -0.2 }, lower: { x: 0, y: 69, rot: -0.2 } },
    right: { upper: { x: 0, y: -50, rot: 0.2 }, lower: { x: 0, y: 69, rot: 0.2 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 0 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  proud: {
    left: { upper: { x: 0, y: -150, rot: 0.2 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: -0.2 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.8, offset: { x: 0, y: -15 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  // ========== 惊吓 ==========
  scared: {
    left: { upper: { x: 0, y: -240, rot: -0.1 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0.1 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.5, offset: { x: 0, y: 0 }, pattern: 'panic' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.fast
  },

  // ========== 眨眼 ==========
  wink_left: {
    left: { upper: { x: 0, y: -100, rot: 0.3 }, lower: { x: 0, y: 172, rot: 0 } },   // 左眼闭
    right: { upper: { x: 0, y: -70, rot: -0.3 }, lower: { x: 0, y: 60, rot: -0.3 } }, // 右眼开
    pupil: { scale: 0.75, offset: { x: 0, y: 0 }, pattern: null },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal 
  },

  wink_right: {
    left: { upper: { x: 0, y: -70, rot: 0.3 }, lower: { x: 0, y: 60, rot: 0.3 } },   // 左眼开
    right: { upper: { x: 0, y: -100, rot: -0.3 }, lower: { x: 0, y: 172, rot: 0 } }, // 右眼闭
    pupil: { scale: 0.75, offset: { x: 0, y: 0 }, pattern: null },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal 
  },

  // ========== 看向 ==========
  look_left: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 30, y: 0 }, pattern: null },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  look_right: {
    left: { upper: { x: 0, y: -150, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: -30, y: 0 }, pattern: null },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  look_around: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 0 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal,
    holdDuration: 5000,
    pupilAnimation: {
      type: 'sine_x',
      amplitude: 28,
      period_ms: 2000,
      duration_ms: 5000
    }
  },

  // ========== 触摸变体（摸哪边看哪边） ==========
  curious_left: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: -15, y: -150, rot: -0.4 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.8, offset: { x: 25, y: -15 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.fast
  },

  curious_right: {
    left: { upper: { x: 15, y: -150, rot: 0.4 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.8, offset: { x: -25, y: -15 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.fast
  },

  confused_left: {
    left: { upper: { x: 0, y: -150, rot: -0.1 }, lower: { x: 0, y: 120, rot: 0 } },
    right: { upper: { x: 0, y: -120, rot: 0.2 }, lower: { x: 0, y: 110, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 25, y: -5 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  confused_right: {
    left: { upper: { x: 0, y: -120, rot: -0.2 }, lower: { x: 0, y: 110, rot: 0 } },
    right: { upper: { x: 0, y: -150, rot: 0.1 }, lower: { x: 0, y: 120, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: -25, y: -5 }, pattern: 'neutral' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  angry_left: {
    left: { upper: { x: 30, y: -140, rot: 0.35 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: -30, y: -140, rot: -0.35 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.6, offset: { x: 25, y: 0 }, pattern: 'anxious' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  angry_right: {
    left: { upper: { x: 30, y: -140, rot: 0.35 }, lower: { x: 0, y: 100, rot: 0 } },
    right: { upper: { x: -30, y: -140, rot: -0.35 }, lower: { x: 0, y: 100, rot: 0 } },
    pupil: { scale: 0.6, offset: { x: -25, y: 0 }, pattern: 'anxious' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal
  },

  enjoy_left: {
    left: { upper: { x: 0, y: -50, rot: 0.3 }, lower: { x: 0, y: 69, rot: 0.3 } },
    right: { upper: { x: 0, y: -50, rot: -0.3 }, lower: { x: 0, y: 69, rot: -0.3 } },
    pupil: { scale: 0.75, offset: { x: 25, y: 5 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  enjoy_right: {
    left: { upper: { x: 0, y: -50, rot: 0.3 }, lower: { x: 0, y: 69, rot: 0.3 } },
    right: { upper: { x: 0, y: -50, rot: -0.3 }, lower: { x: 0, y: 69, rot: -0.3 } },
    pupil: { scale: 0.75, offset: { x: -25, y: 5 }, pattern: 'calm' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow
  },

  // ========== 特殊表情（需特制图层，无眼皮参与） ==========
  tsundere: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 10, y: 0 }, pattern: null },
    gaze: GAZE.none,
    overlay: 'tsundere_L',  // TODO: 需要制作特殊图层
    duration: DURATION.normal
  },

  // ========== 环顾 ==========
  // ========== 睡眠类 ==========
  // ========== 睡眠（完整流程：眼皮开合循环 → 闭眼呼吸） ==========
  sleep: {
    left: { upper: { x: 0, y: -100, rot: 0 }, lower: { x: 0, y: 130, rot: 0 } },
    right: { upper: { x: 0, y: -100, rot: 0 }, lower: { x: 0, y: 130, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 15 }, pattern: null },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.slow,
    holdDuration: null,
    eyelidAnimation: {
      // 第一阶段：正弦波循环（眼皮开合挣扎）
      upper: { range: [-100, 0], period: 5000 },
      lower: { range: [130, 69], period: 4500 },
      phaseDuration: 10000,   // 第一阶段循环 5 秒
      settleDuration: 2000,   // 过渡到闭眼目标位（防跳变）
      settleTarget: { upperY: -50, lowerY: 69 },
      // 第二阶段：闭眼呼吸循环
      afterLoop: {
        upper: { range: [-50, -40], period: 4000 },
        lower: { range: [69, 60], period: 4000 }
      }
    }
  },

  // ========== 醒来类 ==========
  wakeup: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.7, offset: { x: 0, y: 0 }, pattern: 'neutral' },
    gaze: GAZE.follow,
    overlay: null,
    duration: 3000,
    transitionMode: 'direct',
    allowedFrom: ['sleep', 'daze'],
    autoReturnToIdle: true
  },

  startled: {
    left: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    right: { upper: { x: 0, y: -240, rot: 0 }, lower: { x: 0, y: 172, rot: 0 } },
    pupil: { scale: 0.5, offset: { x: 0, y: 0 }, pattern: 'panic' },
    gaze: GAZE.none,
    overlay: null,
    duration: DURATION.normal,
    transitionMode: 'direct',
    eyelidAnimation: {
      type: 'keyframes',
      keyframes: [
        { upper: { y: -50 }, lower: { y: 80 }, duration: 150 },   // 微闭眼（减少下降幅度）
        { upper: { y: -240 }, lower: { y: 172 }, duration: 350 }  // 睁大（放慢速度）
      ],
      loop: false
    }
  }
};

// ============ Pattern 定义 ============
// 瞳孔呼吸感动画
const patterns = {
  calm: {
    property: 'scale',
    amplitude: 0.02,        // ±2% 小变化
    period: 4000            // 4秒 慢节奏
  },
  neutral: {
    property: 'scale',
    amplitude: 0.03,        // ±3% 中等
    period: 3000            // 3秒
  },
  anxious: {
    property: 'scale',
    amplitude: 0.05,        // ±5% 大变化
    period: 1500            // 1.5秒 快节奏
  },
  panic: {
    property: 'scale',
    amplitude: 0.08,        // ±8% 剧烈变化
    period: 800             // 0.8秒 非常急促
  }
};

// ============ Blink 策略 ============
// 只有 idle 使用
const blinkPolicies = {
  off: { enabled: false },
  slow: { enabled: true, interval: [6000, 9000], duration: 1000, count: 1 },
  normal: { enabled: true, interval: [4000, 7000], duration: 600, count: 1 },
  fast: { enabled: true, interval: [2000, 4000], duration: 400, count: 1 },
  fast_twice: { enabled: true, interval: [3000, 5000], duration: 400, count: 2, gap: 150 }
};

// ============ Overlay 定义 ============
const overlays = {
  happy_L: {
    asset: 'happyOverlay',
    layer: 6,
    scale: 1.0,
    timing: { in: 500, hold: 3000, out: 500 }
  },
  imprint_L: {
    asset: 'imprintOverlay',
    layer: 6,
    scale: 1.0,
    timing: { in: 500, hold: 3000, out: 500 },
    pattern: 'neutral'  // overlay 呼吸动画
  },
  tsundere_L: {
    asset: 'tsundereOverlay',
    layer: 6,
    scale: 1.0,
    timing: { in: 500, hold: 3000, out: 500 }
  }
};

// ============ 图层资源 ============
let layers = {
  left: {
    eyeball: null,        // 眼白
    pupil: null,          // 瞳孔
    pupil2: null,         // 备选瞳孔
    highlight: null,      // 高光
    eyelidUpper: null,    // 上眼皮
    eyelidLower: null,    // 下眼皮
    happyOverlay: null,   // 开心覆盖图层
    imprintOverlay: null, // imprint 覆盖图层
    tsundereOverlay: null // tsundere 覆盖图层
  },
  right: {
    eyeball: null,
    pupil: null,
    pupil2: null,
    highlight: null,
    eyelidUpper: null,
    eyelidLower: null,
    happyOverlay: null,
    imprintOverlay: null,
    tsundereOverlay: null
  }
};

// ============ 眼皮位置计算结果 ============
let eyelidCalc = {
  lowerCloseY: 69,    // 下眼皮闭合位置
  lowerOpenY: 172,    // 下眼皮张开位置
  upperOpenY: -240    // 上眼皮张开位置
};

// ============ 运行时状态 ============
let state = {
  // 当前状态：'idle' 或 pose 名称
  current: 'idle',
  
  // 瞳孔位置（实时）
  pupil: { x: 0, y: 0 },
  targetPupil: { x: 0, y: 0 },
  
  // 瞳孔缩放
  pupilScale: 0.7,
  targetPupilScale: 0.7,
  
  // 眨眼状态（只在 idle 时有效）
  blink: {
    active: false,
    timer: 0,
    nextTime: 3000,
    progress: 0,      // 0-1，用于眨眼插值
    count: 0,         // 当前这轮还剩几次眨眼
    inGap: false,     // 是否在两次眨眼之间的间隙
    gapTimer: 0       // 间隙计时器
  },
  
  // 覆盖图层
  overlay: {
    active: false,
    id: null,
    opacity: 0,
    phase: 'none',  // 'in' | 'hold' | 'out' | 'none'
    timer: 0
  },
  
  // 表情过渡
  transition: {
    active: false,
    duration: 300,
    timer: 0,
    progress: 0,
    fromPose: 'idle',   // 起始：'idle' 或 pose 名
    toPose: 'idle',     // 目标：'idle' 或 pose 名
    fromPupilScale: 0.7
  },
  
  // 待处理的 pose（两段式过渡用）
  pendingPose: null,
  
  // Hold 阶段状态
  hold: {
    active: false,
    timer: 0,
    duration: null  // null = 无限
  },
  
  // Pattern 动画状态
  pattern: {
    time: 0,
    scaleOffset: 0,
    posOffset: { x: 0, y: 0 },
    poseOffset: { x: 0, y: 0 }
  },

  // 瞳孔动画状态（pose 内部动画）
  pupilAnim: {
    poseName: null,
    time: 0,
    keyframeIndex: 0,
    keyframeTime: 0,
    startX: 0,
    startY: 0,
    finished: false
  },
  
  // 眼皮动画状态
  eyelidAnim: {
    active: false,
    time: 0,
    upperY: -240,
    lowerY: 172,
    phase2Started: false,
    phase2StartUpperY: -240,
    phase2StartLowerY: 172,
    // 关键帧动画状态
    keyframeIndex: 0,      // 当前关键帧索引
    keyframeTime: 0,       // 当前关键帧已过时间
    startUpperY: -240,     // 当前关键帧起始位置
    startLowerY: 172,
    finished: false        // 动画是否已完成
  }
};

let followMouse = true;
let manualPupil = { x: 0, y: 0 };
let panelControlled = false;

// ============ 辅助函数 ============

// 获取当前状态的配置
function getCurrentConfig() {
  if (state.current === 'idle') {
    return {
      pose: idle.openPose,
      pupil: idle.pupil,
      gaze: idle.gaze,
      duration: idle.duration,
      overlay: null,
      eyelidAnimation: null
    };
  } else {
    const pose = poses[state.current];
    return {
      pose: pose,
      pupil: pose.pupil,
      gaze: pose.gaze,
      duration: pose.duration,
      overlay: pose.overlay,
      eyelidAnimation: pose.eyelidAnimation
    };
  }
}

// 获取指定眼睛的眼皮位置
function getPoseForSide(poseName, side) {
  if (poseName === 'idle') {
    return idle.openPose[side];
  }
  const pose = poses[poseName];
  if (!pose) return idle.openPose[side];
  return pose[side];
}

// 在 openPose 和 closePose 之间插值（用于 idle 眨眼）
function interpolateIdleBlink(side, blinkProgress) {
  const open = idle.openPose[side];
  const close = idle.closePose[side];
  
  return {
    upper: {
      x: lerp(open.upper.x, close.upper.x, blinkProgress),
      y: lerp(open.upper.y, close.upper.y, blinkProgress),
      rot: lerp(open.upper.rot, close.upper.rot, blinkProgress)
    },
    lower: {
      x: lerp(open.lower.x, close.lower.x, blinkProgress),
      y: lerp(open.lower.y, close.lower.y, blinkProgress),
      rot: lerp(open.lower.rot, close.lower.rot, blinkProgress)
    }
  };
}

// 计算当前眼皮姿态
function calculateEyelidPose(side) {
  // 如果正在过渡
  if (state.transition.active) {
    // 获取起始和目标姿态
    const fromPose = state.transition.fromPose === 'idle' 
      ? idle.openPose[side] 
      : getPoseForSide(state.transition.fromPose, side);
    const toPose = state.transition.toPose === 'idle'
      ? idle.openPose[side]
      : getPoseForSide(state.transition.toPose, side);
    const t = state.transition.progress;
    
    return {
      upper: {
        x: lerp(fromPose.upper.x, toPose.upper.x, t),
        y: lerp(fromPose.upper.y, toPose.upper.y, t),
        rot: lerp(fromPose.upper.rot, toPose.upper.rot, t)
      },
      lower: {
        x: lerp(fromPose.lower.x, toPose.lower.x, t),
        y: lerp(fromPose.lower.y, toPose.lower.y, t),
        rot: lerp(fromPose.lower.rot, toPose.lower.rot, t)
      }
    };
  }
  
  // idle 状态：处理眨眼
  if (state.current === 'idle') {
    return interpolateIdleBlink(side, state.blink.progress);
  }
  
  // pose 状态：检查眼皮动画
  const pose = poses[state.current];
  if (pose && pose.eyelidAnimation && state.eyelidAnim.active) {
    return {
      upper: {
        x: pose[side].upper.x,
        y: state.eyelidAnim.upperY,
        rot: pose[side].upper.rot
      },
      lower: {
        x: pose[side].lower.x,
        y: state.eyelidAnim.lowerY,
        rot: pose[side].lower.rot
      }
    };
  }
  
  // pose 状态：静态姿态
  return getPoseForSide(state.current, side);
}

// ============ Overlay 阶段控制 ============
function updateOverlay() {
  if (!state.overlay.active) return;
  
  const overlayData = overlays[state.overlay.id];
  if (!overlayData) return;
  
  state.overlay.timer += deltaTime;
  const timing = overlayData.timing;
  
  switch (state.overlay.phase) {
    case 'in':
      // 渐入阶段：overlay 0→255
      let inProgress = constrain(state.overlay.timer / timing.in, 0, 1);
      state.overlay.opacity = inProgress * 255;
      
      if (state.overlay.timer >= timing.in) {
        state.overlay.phase = 'hold';
        state.overlay.timer = 0;
        state.overlay.opacity = 255;
      }
      break;
      
    case 'hold':
      // 保持阶段
      if (state.overlay.timer >= timing.hold) {
        state.overlay.phase = 'out';
        state.overlay.timer = 0;
      }
      break;
      
    case 'out':
      // 渐出阶段：overlay 255→0
      let outProgress = constrain(state.overlay.timer / timing.out, 0, 1);
      state.overlay.opacity = (1 - outProgress) * 255;
      
      if (state.overlay.timer >= timing.out) {
        state.overlay.phase = 'none';
        state.overlay.active = false;
        state.overlay.opacity = 0;
        // 切换回 neutral
        setEmotion('idle');
      }
      break;
  }
}

// ============ 预加载图片 ============
// 眼珠类型（用于切换）
let pupilType = 'pupil';  // 'pupil' 或 'pupil2'

function preload() {
  if (config.useImages) {
    let onError = (err) => {
      console.warn('图片加载失败', err);
    };
    
    // 左眼图层（独立素材）
    layers.left.eyeball = loadImage('assets/left_eye/eyeball.png', null, onError);
    layers.left.pupil = loadImage('assets/left_eye/pupil.png', null, onError);
    layers.left.pupil2 = loadImage('assets/left_eye/pupil2.png', null, onError);
    layers.left.highlight = loadImage('assets/left_eye/highlight.png', null, onError);
    layers.left.eyelidUpper = loadImage('assets/left_eye/lidU_L.png', null, onError);
    layers.left.eyelidLower = loadImage('assets/left_eye/lidD_L.png', null, onError);
    layers.left.happyOverlay = loadImage('assets/left_eye/happyL.png', null, onError);
    layers.left.imprintOverlay = loadImage('assets/left_eye/imprintL.png', null, onError);
    layers.left.tsundereOverlay = loadImage('assets/left_eye/tsundereL.png', null, onError);

    // 右眼图层（独立素材，不再镜像！）
    layers.right.eyeball = loadImage('assets/right_eye/eyeball.png', null, onError);
    layers.right.pupil = loadImage('assets/right_eye/pupil.png', null, onError);
    layers.right.pupil2 = loadImage('assets/right_eye/pupil2.png', null, onError);
    layers.right.highlight = loadImage('assets/right_eye/highlight.png', null, onError);
    layers.right.eyelidUpper = loadImage('assets/right_eye/lidU_R.png', null, onError);
    layers.right.eyelidLower = loadImage('assets/right_eye/lidD_R.png', null, onError);
    layers.right.happyOverlay = loadImage('assets/right_eye/happyR.png', null, onError);
    layers.right.imprintOverlay = loadImage('assets/right_eye/imprintR.png', null, onError);
    layers.right.tsundereOverlay = loadImage('assets/right_eye/tsundereR.png', null, onError);
  }
}

// 切换眼珠类型
function setPupilType(type) {
  pupilType = type;
  console.log('Pupil type:', type);
}

// ============ 动态计算眼皮位置 ============
// 根据实际图片尺寸计算，适配不同尺寸的图片
function calculateEyelidPositions() {
  const eyeballSize = config.eyeSize;  // 眼球直径 (240)
  const eyeballRadius = eyeballSize / 2;  // 眼球半径 (120)
  
  // 获取下眼皮图片实际高度
  let lidDHeight = 103;  // 默认值
  if (layers.left.eyelidLower && layers.left.eyelidLower.height) {
    lidDHeight = layers.left.eyelidLower.height;
  }
  
  // 获取上眼皮图片实际高度
  let lidUHeight = eyeballSize;  // 默认值
  if (layers.left.eyelidUpper && layers.left.eyelidUpper.height) {
    lidUHeight = layers.left.eyelidUpper.height;
  }
  
  // 计算位置
  // 下眼皮闭合: 下眼皮中心位于 eyeball 中心下方，使下眼皮下缘 = eyeball 下缘
  // y = eyeballRadius - lidDHeight/2
  eyelidCalc.lowerCloseY = Math.round(eyeballRadius - lidDHeight / 2);
  
  // 下眼皮张开: 下眼皮上缘 = eyeball 下缘，即下眼皮退出画面
  // y = eyeballRadius + lidDHeight/2
  eyelidCalc.lowerOpenY = Math.round(eyeballRadius + lidDHeight / 2);
  
  // 上眼皮张开: 完全出画（负值，向上）
  eyelidCalc.upperOpenY = -eyeballSize;
  
  // 更新 idle.closePose
  idle.closePose.left.lower.y = eyelidCalc.lowerCloseY;
  idle.closePose.right.lower.y = eyelidCalc.lowerCloseY;
  
  console.log('眼皮位置计算完成:', {
    '下眼皮图片高度': lidDHeight,
    '上眼皮图片高度': lidUHeight,
    '下眼皮闭合Y': eyelidCalc.lowerCloseY,
    '下眼皮张开Y': eyelidCalc.lowerOpenY,
    '上眼皮张开Y': eyelidCalc.upperOpenY
  });
}

// ============ 初始化 ============
function setup() {
  let canvas = createCanvas(config.canvasWidth, config.canvasHeight);
  canvas.parent('canvas-container');
  imageMode(CENTER);
  frameRate(60);

  // 根据实际图片尺寸动态计算眼皮位置
  calculateEyelidPositions();
  
  // 初始化眨眼 UI
  setTimeout(notifyBlinkUI, 100);
}

// ============ 主循环 ============
function draw() {
  background('#fff5f5');
  
  // 更新状态
  handleBlink();
  updateEyelidAnimation();   // 更新眼皮循环动画（如 sleepy）
  updatePattern();           // 更新呼吸感等 pattern
  updatePupilAnimation();    // 更新 pose 内部瞳孔动画（happy2/look_around）
  updatePupilFromMouse();    // 使用 follow + offset + pattern
  updateOverlay();
  updateHoldPhase();         // 更新 hold 阶段计时
  smoothUpdate();
  
  // 计算眼睛位置
  let leftEyeX = config.canvasWidth / 2 - config.eyeGap / 2 - config.eyeSize / 2;
  let rightEyeX = config.canvasWidth / 2 + config.eyeGap / 2 + config.eyeSize / 2;
  let eyeY = config.canvasHeight / 2;
  
  // 绘制两只眼睛
  drawEye(leftEyeX, eyeY, 'left');
  drawEye(rightEyeX, eyeY, 'right');
  
  // 绘制调试信息
  if (window.debugMode) {
    drawDebugInfo();
  }
}

// ============ 绘制单只眼睛 ============
function drawEye(x, y, side) {
  push();
  translate(x, y);
  
  if (config.useImages && layers[side].eyeball) {
    drawImageLayers(side);
  } else {
    // 几何绘制模式 (fallback)
    let eyeOpen = 1 - state.blink.progress;  // 简化的眨眼控制
    drawCodeLayers(side, eyeOpen);
  }
  
  pop();
}

// ============ 图片图层绘制 ============
// 图层顺序（从上到下）：上眼皮 → 下眼皮 → 高光 → 眼珠 → 眼白
// 绘制顺序（先画在下）：眼白 → 眼珠 → 高光 → 下眼皮 → 上眼皮
function drawImageLayers(side) {
  let layer = layers[side];
  let s = config.eyeSize;
  
  // 计算当前眼皮姿态（考虑眨眼插值）
  const eyelidPose = calculateEyelidPose(side);
  
  // ===== 椭圆遮罩 =====
  if (config.useEllipseMask) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.ellipse(0, 0, s * config.maskRadiusX, s * config.maskRadiusY, 0, 0, TWO_PI);
    drawingContext.clip();
  }
  
  // 1. 眼白 (最底层)
  if (layer.eyeball) {
    image(layer.eyeball, 0, 0, s, s);
  }
  
  // 2. 眼珠 (跟随鼠标/Gaze，支持切换 pupil/pupil2)
  let currentPupil = (pupilType === 'pupil2' && layer.pupil2) ? layer.pupil2 : layer.pupil;
  if (currentPupil) {
    push();
    translate(state.pupil.x, state.pupil.y);
    // 加上 pattern 的缩放偏移（呼吸感）
    let pupilSize = s * (state.pupilScale + state.pattern.scaleOffset);
    image(currentPupil, 0, 0, pupilSize, pupilSize);
    pop();
  }
  
  // 3. 高光 (跟随瞳孔，幅度小)
  if (layer.highlight) {
    push();
    translate(state.pupil.x * config.highlightFollow, state.pupil.y * config.highlightFollow);
    image(layer.highlight, 0, 0, s, s);
    pop();
  }
  
  // 4. 下眼皮（原图尺寸，居中对齐）
  if (layer.eyelidLower) {
    push();
    translate(eyelidPose.lower.x, eyelidPose.lower.y);
    rotate(eyelidPose.lower.rot);
    image(layer.eyelidLower, 0, 0);  // 原图尺寸
    pop();
  }
  
  // 5. 上眼皮（原图尺寸，居中对齐，可旋转可X偏移）
  if (layer.eyelidUpper) {
    push();
    translate(eyelidPose.upper.x, eyelidPose.upper.y);
    rotate(eyelidPose.upper.rot);
    image(layer.eyelidUpper, 0, 0);  // 原图尺寸
    pop();
  }
  
  // 6. 覆盖图层 (如 happyL, imprintL, tsundereL) - 在眼皮之上、遮罩之内
  if (state.overlay.active && state.overlay.id) {
    const overlayData = overlays[state.overlay.id];
    if (overlayData) {
      const overlayImage = layer[overlayData.asset];  // 动态获取对应图层
      if (overlayImage) {
        push();
        tint(255, state.overlay.opacity);
        
        // 计算 overlay 缩放（基础 + pattern 呼吸）
        let overlayScale = overlayData.scale;
        if (overlayData.pattern && patterns[overlayData.pattern]) {
          const pat = patterns[overlayData.pattern];
          const phase = (millis() % pat.period) / pat.period;
          const breath = Math.sin(phase * Math.PI * 2) * pat.amplitude;
          overlayScale += breath;
        }
        
        image(overlayImage, 0, 0, s * overlayScale, s * overlayScale);
        noTint();
        pop();
        // 调试
        if (side === 'left' && frameCount % 60 === 0) {
          console.log('Overlay:', state.overlay.id, state.overlay.phase, 'opacity:', state.overlay.opacity.toFixed(0));
        }
      }
    }
  }
  
  // ===== 结束椭圆遮罩 =====
  if (config.useEllipseMask) {
    drawingContext.restore();
  }
}

// ============ 代码绘制（无图片时的占位） ============
function drawCodeLayers(side, eyeOpen) {
  let s = config.eyeSize;
  let pupilOffset = state.pupil;
  
  // 绘制参考框
  noFill();
  stroke(200);
  strokeWeight(1);
  rect(-s/2, -s/2, s, s);
  
  // 眼白
  fill(255);
  stroke(50);
  strokeWeight(3);
  let eyeH = s * 0.7 * eyeOpen;
  ellipse(0, 0, s * 0.8, eyeH);
  
  // 瞳孔
  if (eyeOpen > 0.2) {
    let pupilSize = s * 0.35 * state.pupilScale;
    let px = pupilOffset.x;
    let py = pupilOffset.y * eyeOpen;
    
    // 限制瞳孔在眼睛内
    let maxX = (s * 0.8 - pupilSize) / 2 - 5;
    let maxY = (eyeH - pupilSize) / 2 - 5;
    px = constrain(px, -maxX, maxX);
    py = constrain(py, -maxY, maxY);
    
    fill(30);
    noStroke();
    ellipse(px, py, pupilSize, pupilSize * eyeOpen);
    
    // 高光
    fill(255);
    let hlX = px - pupilSize * 0.2;
    let hlY = py - pupilSize * 0.2;
    ellipse(hlX, hlY, pupilSize * 0.25, pupilSize * 0.25 * eyeOpen);
  }
  
  // 眼皮遮罩效果（模拟闭眼）
  if (eyeOpen < 0.95) {
    fill('#fff5f5');
    noStroke();
    // 上眼皮
    let maskY = map(eyeOpen, 1, 0, -s/2 - 50, 0);
    rect(-s/2 - 10, -s/2 - 50, s + 20, s/2 + 50 + maskY);
    // 下眼皮
    let maskY2 = map(eyeOpen, 1, 0, s/2 + 50, 0);
    rect(-s/2 - 10, maskY2, s + 20, s/2 + 50);
  }
  
  // 显示图层标签
  fill(150);
  noStroke();
  textSize(10);
  textAlign(CENTER);
  text(`${side} eye`, 0, s/2 + 15);
  text(`(240×240)`, 0, s/2 + 28);
}

// ============ 眨眼处理 ============
// 只有 idle 状态才能眨眼
function handleBlink() {
  // 非 idle 状态不眨眼
  if (state.current !== 'idle') {
    state.blink.progress = 0;
    state.blink.active = false;
    state.blink.count = 0;
    state.blink.inGap = false;
    return;
  }

  const policy = blinkPolicies[idle.blinkPolicy];

  // 面板控制时不自动眨眼
  if (panelControlled) return;

  // 覆盖图层激活时不眨眼
  if (state.overlay.active) return;

  // 表情过渡期间不眨眼
  if (state.transition.active) {
    state.blink.progress = 0;
    return;
  }

  // 眨眼策略关闭时不眨眼
  if (!policy.enabled) {
    state.blink.progress = 0;
    return;
  }

  // 处理两次眨眼之间的间隙
  if (state.blink.inGap) {
    state.blink.gapTimer += deltaTime;
    if (state.blink.gapTimer >= (policy.gap || 150)) {
      state.blink.inGap = false;
      state.blink.gapTimer = 0;
      state.blink.active = true;
      state.blink.timer = 0;
    }
    return;
  }

  // 更新眨眼计时器
  state.blink.timer += deltaTime;

  // 触发自动眨眼
  if (state.blink.timer > state.blink.nextTime && !state.blink.active && state.blink.count === 0) {
    triggerBlink();
  }

  // 眨眼动画
  if (state.blink.active) {
    let blinkTime = state.blink.timer / policy.duration;

    if (blinkTime < 0.5) {
      state.blink.progress = blinkTime * 2;
    } else if (blinkTime < 1) {
      state.blink.progress = 1 - (blinkTime - 0.5) * 2;
    } else {
      // 单次眨眼完成
      state.blink.active = false;
      state.blink.timer = 0;
      state.blink.progress = 0;
      state.blink.count--;
      
      // 检查是否还需要继续眨眼
      if (state.blink.count > 0) {
        // 进入间隙等待
        state.blink.inGap = true;
        state.blink.gapTimer = 0;
      } else {
        // 眨眼轮次结束，设置下次眨眼时间
        state.blink.nextTime = random(policy.interval[0], policy.interval[1]);
      }
    }
  }
}

function triggerBlink() {
  // 只有 idle 状态才能眨眼
  if (state.current !== 'idle') return;

  const policy = blinkPolicies[idle.blinkPolicy];
  if (!policy.enabled) return;

  state.blink.active = true;
  state.blink.timer = 0;
  state.blink.progress = 0;
  state.blink.count = policy.count || 1;  // 设置眨眼次数
  state.blink.inGap = false;
  state.blink.gapTimer = 0;
}

// ============ 鼠标跟随 ============
function updatePupilFromMouse() {
  // 获取当前配置
  const cfg = getCurrentConfig();
  const pupilConfig = cfg.pupil;
  const gaze = cfg.gaze;
  
  // 基础位置 = 配置的 offset
  let baseX = pupilConfig.offset.x;
  let baseY = pupilConfig.offset.y;
  
  // 鼠标跟随（gaze != none 时）
  const canFollow = followMouse && gaze !== GAZE.none;
  
  if (canFollow) {
    let centerX = config.canvasWidth / 2;
    let centerY = config.canvasHeight / 2;
    
    let mx = mouseX - centerX;
    let my = mouseY - centerY;
    
    let maxOffset = config.pupilMaxOffset;
    let gain = gaze;  // -1, 0, 1
    
    baseX += constrain(mx * 0.1 * gain, -maxOffset, maxOffset);
    baseY += constrain(my * 0.1 * gain, -maxOffset, maxOffset);
  } else if (!followMouse) {
    // 手动控制
    baseX = manualPupil.x;
    baseY = manualPupil.y;
  }
  
  // 加上 pattern 偏移
  baseX += state.pattern.posOffset.x;
  baseY += state.pattern.posOffset.y;

  // 加上 pose 内部瞳孔动画偏移
  baseX += state.pattern.poseOffset.x;
  baseY += state.pattern.poseOffset.y;
  
  state.targetPupil.x = baseX;
  state.targetPupil.y = baseY;
}

// ============ 眼皮动画更新 ============
function updateEyelidAnimation() {
  // idle 状态没有眼皮动画
  if (state.current === 'idle') {
    state.eyelidAnim.active = false;
    state.eyelidAnim.finished = false;
    state.eyelidAnim.phase2Started = false;
    return;
  }
  
  const pose = poses[state.current];
  if (!pose || !pose.eyelidAnimation) {
    state.eyelidAnim.active = false;
    state.eyelidAnim.finished = false;
    state.eyelidAnim.phase2Started = false;
    return;
  }
  
  // 只在过渡完成后才启动眼皮动画
  if (state.transition.active) {
    state.eyelidAnim.active = false;
    state.eyelidAnim.time = 0;
    state.eyelidAnim.phase2Started = false;
    state.eyelidAnim.keyframeIndex = 0;
    state.eyelidAnim.keyframeTime = 0;
    state.eyelidAnim.finished = false;
    return;
  }
  
  const anim = pose.eyelidAnimation;
  
  // 关键帧动画
  if (anim.type === 'keyframes') {
    // 如果动画已完成，检查是否有 afterLoop
    if (state.eyelidAnim.finished && !anim.loop) {
      if (anim.afterLoop) {
        // 关键帧完成后，切换到循环动画
        state.eyelidAnim.active = true;
        state.eyelidAnim.time += deltaTime;
        
        const afterAnim = anim.afterLoop;
        if (afterAnim.upper) {
          const phase = (state.eyelidAnim.time % afterAnim.upper.period) / afterAnim.upper.period;
          const wave = (1 - cos(phase * TWO_PI)) / 2;
          const [minY, maxY] = afterAnim.upper.range;
          state.eyelidAnim.upperY = lerp(minY, maxY, wave);
        }
        if (afterAnim.lower) {
          const phase = (state.eyelidAnim.time % afterAnim.lower.period) / afterAnim.lower.period;
          const wave = (1 - cos(phase * TWO_PI)) / 2;
          const [minY, maxY] = afterAnim.lower.range;
          state.eyelidAnim.lowerY = lerp(minY, maxY, wave);
        }
        return;
      }
      // 没有 afterLoop，保持最终状态
      state.eyelidAnim.active = true;
      return;
    }
    
    state.eyelidAnim.active = true;
    const keyframes = anim.keyframes;
    
    // 初始化起始位置（第一次进入时）
    if (state.eyelidAnim.keyframeIndex === 0 && state.eyelidAnim.keyframeTime === 0) {
      state.eyelidAnim.startUpperY = state.eyelidAnim.upperY;
      state.eyelidAnim.startLowerY = state.eyelidAnim.lowerY;
    }
    
    const currentKF = keyframes[state.eyelidAnim.keyframeIndex];
    state.eyelidAnim.keyframeTime += deltaTime;
    
    // 计算当前关键帧进度
    const progress = Math.min(state.eyelidAnim.keyframeTime / currentKF.duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);  // easeOutCubic
    
    // 插值到目标位置
    state.eyelidAnim.upperY = lerp(state.eyelidAnim.startUpperY, currentKF.upper.y, easedProgress);
    state.eyelidAnim.lowerY = lerp(state.eyelidAnim.startLowerY, currentKF.lower.y, easedProgress);
    
    // 当前关键帧完成，进入下一个
    if (progress >= 1) {
      state.eyelidAnim.keyframeIndex++;
      state.eyelidAnim.keyframeTime = 0;
      state.eyelidAnim.startUpperY = currentKF.upper.y;
      state.eyelidAnim.startLowerY = currentKF.lower.y;
      
      // 所有关键帧完成
      if (state.eyelidAnim.keyframeIndex >= keyframes.length) {
        if (anim.loop) {
          state.eyelidAnim.keyframeIndex = 0;
        } else {
          state.eyelidAnim.finished = true;
          state.eyelidAnim.keyframeIndex = keyframes.length - 1;
          state.eyelidAnim.time = 0;  // 重置时间，为 afterLoop 准备
        }
      }
    }
    return;
  }
  
  // 循环动画
  state.eyelidAnim.active = true;
  state.eyelidAnim.time += deltaTime;

  // 计算循环动画某时刻的眼皮位置
  const sampleLoop = (loopAnim, sampleTime) => {
    let upperY = state.eyelidAnim.upperY;
    let lowerY = state.eyelidAnim.lowerY;

    if (loopAnim.upper) {
      const phase = (sampleTime % loopAnim.upper.period) / loopAnim.upper.period;
      const wave = (1 - cos(phase * TWO_PI)) / 2;
      const [minY, maxY] = loopAnim.upper.range;
      upperY = lerp(minY, maxY, wave);
    }
    if (loopAnim.lower) {
      const phase = (sampleTime % loopAnim.lower.period) / loopAnim.lower.period;
      const wave = (1 - cos(phase * TWO_PI)) / 2;
      const [minY, maxY] = loopAnim.lower.range;
      lowerY = lerp(minY, maxY, wave);
    }
    return { upperY, lowerY };
  };

  // 三段式：阶段1循环 -> 阶段2收敛 -> 阶段3 afterLoop循环
  if (anim.phaseDuration && anim.afterLoop) {
    const elapsed = state.eyelidAnim.time;

    // 阶段1：困倦循环
    if (elapsed < anim.phaseDuration) {
      state.eyelidAnim.phase2Started = false;
      const v = sampleLoop(anim, elapsed);
      state.eyelidAnim.upperY = v.upperY;
      state.eyelidAnim.lowerY = v.lowerY;
      return;
    }

    // 阶段2：平滑收敛到闭眼目标位（防止跳变）
    const settleDuration = anim.settleDuration || 0;
    const afterElapsed = elapsed - anim.phaseDuration;
    const settleTargetUpper = anim.settleTarget?.upperY ?? (anim.afterLoop.upper ? anim.afterLoop.upper.range[0] : state.eyelidAnim.upperY);
    const settleTargetLower = anim.settleTarget?.lowerY ?? (anim.afterLoop.lower ? anim.afterLoop.lower.range[0] : state.eyelidAnim.lowerY);

    if (settleDuration > 0 && afterElapsed < settleDuration) {
      if (!state.eyelidAnim.phase2Started) {
        // 从阶段1结束位置开始收敛，避免第一帧卡顿
        const endPhase1 = sampleLoop(anim, anim.phaseDuration);
        state.eyelidAnim.phase2StartUpperY = endPhase1.upperY;
        state.eyelidAnim.phase2StartLowerY = endPhase1.lowerY;
        state.eyelidAnim.phase2Started = true;
      }
      const t = afterElapsed / settleDuration;
      const easedT = 1 - Math.pow(1 - t, 3); // easeOutCubic
      state.eyelidAnim.upperY = lerp(state.eyelidAnim.phase2StartUpperY, settleTargetUpper, easedT);
      state.eyelidAnim.lowerY = lerp(state.eyelidAnim.phase2StartLowerY, settleTargetLower, easedT);
      return;
    }

    // 阶段3：闭眼呼吸循环
    const afterTime = Math.max(0, afterElapsed - settleDuration);
    const v = sampleLoop(anim.afterLoop, afterTime);
    state.eyelidAnim.upperY = v.upperY;
    state.eyelidAnim.lowerY = v.lowerY;
    return;
  }

  // 普通循环动画
  state.eyelidAnim.phase2Started = false;
  const v = sampleLoop(anim, state.eyelidAnim.time);
  state.eyelidAnim.upperY = v.upperY;
  state.eyelidAnim.lowerY = v.lowerY;
}

// ============ Pattern 动画更新 ============
function updatePattern() {
  const cfg = getCurrentConfig();
  const patternName = cfg.pupil.pattern;
  
  if (!patternName || !patterns[patternName]) {
    state.pattern.scaleOffset = 0;
    state.pattern.posOffset.x = 0;
    state.pattern.posOffset.y = 0;
    return;
  }
  
  const pattern = patterns[patternName];
  state.pattern.time += deltaTime;
  
  const phase = (state.pattern.time % pattern.period) / pattern.period;
  const wave = (1 - cos(phase * TWO_PI)) / 2;
  
  if (pattern.property === 'scale') {
    state.pattern.scaleOffset = wave * pattern.amplitude;
  } else if (pattern.property === 'offset') {
    state.pattern.posOffset.x = wave * pattern.amplitude.x;
    state.pattern.posOffset.y = wave * pattern.amplitude.y;
  }
}

// ============ 瞳孔动画更新（pose 内部） ============
function updatePupilAnimation() {
  const pose = poses[state.current];

  // idle/无动画/过渡中：清空
  if (state.current === 'idle' || !pose || !pose.pupilAnimation || state.transition.active) {
    state.pattern.poseOffset.x = 0;
    state.pattern.poseOffset.y = 0;
    state.pupilAnim.poseName = null;
    state.pupilAnim.time = 0;
    state.pupilAnim.keyframeIndex = 0;
    state.pupilAnim.keyframeTime = 0;
    state.pupilAnim.startX = 0;
    state.pupilAnim.startY = 0;
    state.pupilAnim.finished = false;
    return;
  }

  const anim = pose.pupilAnimation;

  // 切换到新 pose 时重置
  if (state.pupilAnim.poseName !== state.current) {
    state.pupilAnim.poseName = state.current;
    state.pupilAnim.time = 0;
    state.pupilAnim.keyframeIndex = 0;
    state.pupilAnim.keyframeTime = 0;
    state.pupilAnim.startX = 0;
    state.pupilAnim.startY = 0;
    state.pupilAnim.finished = false;
    state.pattern.poseOffset.x = 0;
    state.pattern.poseOffset.y = 0;
  }

  state.pupilAnim.time += deltaTime;

  // keyframes: happy2 的眼珠轨迹
  if (anim.type === 'keyframes') {
    const frames = anim.keyframes || [];
    if (frames.length === 0) return;

    if (state.pupilAnim.finished && !anim.loop) return;

    const idx = Math.min(state.pupilAnim.keyframeIndex, frames.length - 1);
    const currentKF = frames[idx];
    const frameDuration = Math.max(currentKF.duration_ms || 1, 1);

    if (state.pupilAnim.keyframeTime === 0) {
      state.pupilAnim.startX = state.pattern.poseOffset.x;
      state.pupilAnim.startY = state.pattern.poseOffset.y;
    }

    state.pupilAnim.keyframeTime += deltaTime;
    const t = Math.min(state.pupilAnim.keyframeTime / frameDuration, 1);
    const easedT = 1 - Math.pow(1 - t, 3); // easeOutCubic

    const targetX = currentKF.offset_x || 0;
    const targetY = currentKF.offset_y || 0;
    state.pattern.poseOffset.x = lerp(state.pupilAnim.startX, targetX, easedT);
    state.pattern.poseOffset.y = lerp(state.pupilAnim.startY, targetY, easedT);

    if (t >= 1) {
      state.pupilAnim.keyframeIndex++;
      state.pupilAnim.keyframeTime = 0;
      state.pupilAnim.startX = targetX;
      state.pupilAnim.startY = targetY;

      if (state.pupilAnim.keyframeIndex >= frames.length) {
        if (anim.loop) {
          state.pupilAnim.keyframeIndex = 0;
        } else {
          state.pupilAnim.keyframeIndex = frames.length - 1;
          state.pupilAnim.finished = true;
        }
      }
    }
    return;
  }

  // sine_x: look_around 的左右环顾
  if (anim.type === 'sine_x') {
    const sampleTime = anim.duration_ms
      ? Math.min(state.pupilAnim.time, anim.duration_ms)
      : state.pupilAnim.time;
    const period = Math.max(anim.period_ms || 1000, 1);
    const phase = (sampleTime % period) / period;
    state.pattern.poseOffset.x = sin(phase * TWO_PI) * (anim.amplitude || 0);
    state.pattern.poseOffset.y = 0;
  }
}

// ============ 平滑更新 ============
// ============ Hold 阶段管理 ============
// 默认 hold 时长（普通表情）
const DEFAULT_HOLD_DURATION = 2000;

function startHoldPhase() {
  const pose = poses[state.current];
  if (!pose) {
    state.hold.active = false;
    return;
  }
  
  state.hold.active = true;
  state.hold.timer = 0;
  // holdDuration: 数字 = 指定时长, null = 无限, undefined = 使用默认值
  state.hold.duration = pose.holdDuration !== undefined 
    ? pose.holdDuration 
    : DEFAULT_HOLD_DURATION;
}

function updateHoldPhase() {
  if (!state.hold.active) return;
  if (state.transition.active) return;  // 过渡中不计时
  if (state.hold.duration === null) return;  // 无限 hold
  
  state.hold.timer += deltaTime;
  
  // hold 时间到，自动转场
  if (state.hold.timer >= state.hold.duration) {
    state.hold.active = false;
    
    const pose = poses[state.current];
    if (pose && pose.nextPose) {
      // 有指定下一个表情，自动切换
      setEmotion(pose.nextPose);
    } else {
      // 没有指定，回到 idle
      setEmotion('idle');
    }
  }
}

function smoothUpdate() {
  // 面板控制时不进行 lerp
  if (panelControlled) {
    state.pupil.x = state.targetPupil.x;
    state.pupil.y = state.targetPupil.y;
    return;
  }
  
  let speed = 0.12;
  
  // 瞳孔位置（跟随鼠标/Gaze）
  state.pupil.x = lerp(state.pupil.x, state.targetPupil.x, speed);
  state.pupil.y = lerp(state.pupil.y, state.targetPupil.y, speed);
  
  // 表情过渡动画（基于时间的插值）
  if (state.transition.active) {
    state.transition.timer += deltaTime;
    let t = constrain(state.transition.timer / state.transition.duration, 0, 1);
    let easedT = 1 - Math.pow(1 - t, 3);  // easeOutCubic
    
    // 更新过渡进度（供 calculateEyelidPose 使用）
    state.transition.progress = easedT;
    
    // 瞳孔缩放
    state.pupilScale = lerp(state.transition.fromPupilScale, state.targetPupilScale, easedT);
    
    if (t >= 1) {
      state.transition.active = false;
      state.transition.progress = 1;
      
      // 检查是否有待处理的 pose（两段式过渡的第二段）
      if (state.pendingPose) {
        const pendingPoseName = state.pendingPose;
        state.pendingPose = null;
        // 执行第二段过渡：idle → 目标 pose
        setEmotion(pendingPoseName);
      } else {
        // 检查是否需要自动返回 idle
        const currentPose = poses[state.current];
        if (currentPose && currentPose.autoReturnToIdle) {
          state.current = 'idle';
          notifyBlinkUI();
        } else {
          // 过渡完成，启动 hold 阶段
          startHoldPhase();
        }
      }
    }
  } else {
    // 非过渡时使用 lerp
    state.pupilScale = lerp(state.pupilScale, state.targetPupilScale, speed);
  }
}

// ============ 启动表情过渡 ============
function startTransition(fromPose, toPose, duration) {
  state.transition.fromPupilScale = state.pupilScale;
  state.transition.fromPose = fromPose;   // 'idle' 或 pose 名
  state.transition.toPose = toPose;       // 'idle' 或 pose 名
  state.transition.duration = duration;
  state.transition.timer = 0;
  state.transition.progress = 0;
  state.transition.active = true;
}

// ============ 表情设置 ============
// 过渡逻辑：
// - idle → pose: idle.openPose → pose (in)
// - pose → idle: pose → idle.openPose (out)
// - pose A → pose B: pose A → idle.openPose (out), 然后排队 idle.openPose → pose B (in)
function setEmotion(emotionId) {
  console.log('setEmotion called:', emotionId, 'current:', state.current);
  panelControlled = false;
  
  // 重置 hold 状态
  state.hold.active = false;
  state.hold.timer = 0;
  
  // 如果目标就是当前状态，不做任何事
  if (emotionId === state.current) return;
  
  // 目标是 idle
  if (emotionId === 'idle') {
    state.targetPupilScale = idle.pupil.scale;
    state.pendingPose = null;  // 清除待处理的 pose
    
    // 清理 overlay
    if (state.overlay.active) {
      state.overlay.active = false;
      state.overlay.phase = 'none';
      state.overlay.opacity = 0;
    }
    
    // 如果当前是 pose，先过渡回 idle (out)
    if (state.current !== 'idle') {
      const currentPose = poses[state.current];
      const outDuration = currentPose ? currentPose.duration : DURATION.normal;
      startTransition(state.current, 'idle', outDuration);
    }
    
    state.current = 'idle';
    notifyBlinkUI();
    return;
  }

  // 目标是 pose
  const targetPose = poses[emotionId];
  if (!targetPose) {
    console.warn(`Unknown pose: ${emotionId}`);
    return;
  }
  
  // 检查 allowedFrom 限制
  if (targetPose.allowedFrom && targetPose.allowedFrom.length > 0) {
    if (!targetPose.allowedFrom.includes(state.current)) {
      console.warn(`Pose "${emotionId}" only allowed from: ${targetPose.allowedFrom.join(', ')}, current: ${state.current}`);
      return;
    }
  }
  
  // 如果当前不是 idle，检查过渡模式
  if (state.current !== 'idle') {
    // direct 模式：直接从当前位置过渡到目标
    if (targetPose.transitionMode === 'direct') {
      state.targetPupilScale = targetPose.pupil.scale;
      
      // 处理 overlay
      if (targetPose.overlay) {
        state.overlay.active = true;
        state.overlay.id = targetPose.overlay;
        state.overlay.phase = 'in';
        state.overlay.timer = 0;
        state.overlay.opacity = 0;
      } else if (state.overlay.active) {
        state.overlay.active = false;
        state.overlay.phase = 'none';
        state.overlay.opacity = 0;
      }
      
      // 重置关键帧动画状态
      state.eyelidAnim.keyframeIndex = 0;
      state.eyelidAnim.keyframeTime = 0;
      state.eyelidAnim.finished = false;
      
      // 直接过渡：当前 pose → 目标 pose
      startTransition(state.current, emotionId, targetPose.duration);
      state.current = emotionId;
      notifyBlinkUI();
      return;
    }
    
    // 默认模式：先过渡回 idle，然后排队进入新 pose（两段式）
    state.pendingPose = emotionId;
    const currentPose = poses[state.current];
    const outDuration = currentPose ? currentPose.duration : DURATION.normal;
    startTransition(state.current, 'idle', outDuration);
    state.current = 'idle';  // 标记正在回到 idle
    return;
  }
  
  // 当前是 idle，直接进入目标 pose (in)
  state.targetPupilScale = targetPose.pupil.scale;
  
  // 处理 overlay
  if (targetPose.overlay) {
    state.overlay.active = true;
    state.overlay.id = targetPose.overlay;
    state.overlay.phase = 'in';
    state.overlay.timer = 0;
    state.overlay.opacity = 0;
  } else if (state.overlay.active) {
    state.overlay.active = false;
    state.overlay.phase = 'none';
    state.overlay.opacity = 0;
  }
  
  state.current = emotionId;
  startTransition('idle', emotionId, targetPose.duration);
  notifyBlinkUI();
}

// 通知 HTML 更新眨眼 UI 状态
function notifyBlinkUI() {
  if (window.updateBlinkUI) {
    window.updateBlinkUI(state.current === 'idle', idle.blinkPolicy);
  }
}

// ============ 调试信息 ============
function drawDebugInfo() {
  fill(100);
  noStroke();
  textSize(12);
  textAlign(LEFT);
  text(`State: ${state.current}`, 10, 20);
  text(`Blink: ${state.blink.progress.toFixed(2)}`, 10, 35);
  text(`Pupil: (${state.pupil.x.toFixed(1)}, ${state.pupil.y.toFixed(1)})`, 10, 50);
  text(`Pupil Scale: ${state.pupilScale.toFixed(2)}`, 10, 65);
}

// ============ 交互 ============
function keyPressed() {
  switch (key) {
    case '1': setEmotion('idle'); break;
    case '2': setEmotion('happy'); break;
    case '3': setEmotion('sad'); break;
    case '4': setEmotion('angry'); break;
    case '5': setEmotion('sleepy'); break;
    case '6': setEmotion('adore'); break;
    case ' ': triggerBlink(); break;
    case 'd': window.debugMode = !window.debugMode; break;
  }
}

// ============ 面板控制接口 ============
function updateFromPanel(name, value, syncEyes) {
  switch (name) {
    case 'pupilX':
      followMouse = false;
      manualPupil.x = value;
      state.targetPupil.x = value;
      state.pupil.x = value;
      break;
    case 'pupilY':
      followMouse = false;
      manualPupil.y = value;
      state.targetPupil.y = value;
      state.pupil.y = value;
      break;
    case 'pupilScale':
      state.targetPupilScale = value;
      state.pupilScale = value;
      break;
  }
  
  console.log(`Panel: ${name} = ${value}`);  // 调试日志
}

function setFollowMouse(enabled) {
  followMouse = enabled;
}

function resetToNeutral() {
  panelControlled = false;
  state.current = 'idle';
  state.targetPupil = { x: 0, y: 0 };
  state.pupil = { x: 0, y: 0 };
  manualPupil = { x: 0, y: 0 };
  state.targetPupilScale = idle.pupil.scale;
  state.pupilScale = idle.pupil.scale;
  state.blink.progress = 0;
  state.blink.active = false;
  state.overlay.opacity = 0;
  state.overlay.active = false;
  state.overlay.phase = 'none';
  state.transition.active = false;
  state.eyelidAnim.active = false;
  followMouse = true;
}

function setPanelControlled(enabled) {
  panelControlled = enabled;
}

// ============ 遮罩控制 ============
function setMaskEnabled(enabled) {
  config.useEllipseMask = enabled;
}

// ============ 眨眼速度控制 ============
function setBlinkSpeed(duration) {
  // 更新所有眨眼策略的 duration
  Object.keys(blinkPolicies).forEach(key => {
    if (blinkPolicies[key].enabled) {
      blinkPolicies[key].duration = duration;
    }
  });
}

// ============ 切换眨眼策略 ============
function setBlinkPolicy(policyName) {
  // 只有 idle 状态才能切换眨眼策略
  if (state.current !== 'idle') {
    console.warn('Can only change blink policy in idle state');
    return;
  }
  if (!blinkPolicies[policyName]) {
    console.warn('Unknown blink policy:', policyName);
    return;
  }
  idle.blinkPolicy = policyName;
  // 重置眨眼状态
  state.blink.active = false;
  state.blink.timer = 0;
  state.blink.progress = 0;
  state.blink.count = 0;
  state.blink.inGap = false;
  console.log('Blink policy set to:', policyName);
  notifyBlinkUI();
}

// ============ 眼皮开合控制 ============
function setEyeOpen(value) {
  // 1 = 全开 (blink.progress = 0), 0 = 全闭 (blink.progress = 1)
  state.blink.progress = 1 - value;
}

// ============ 眼皮位置控制 ============
// 修改 Pose 的眼皮位置 (用于运行时调试)
function modifyPose(poseName, side, type, key, value) {
  if (poses[poseName] && poses[poseName][side]) {
    poses[poseName][side][type][key] = value;
  }
}

// 暴露给 HTML 按钮调用
window.setEmotion = setEmotion;
window.triggerBlink = triggerBlink;
window.updateFromPanel = updateFromPanel;
window.setFollowMouse = setFollowMouse;
window.resetToNeutral = resetToNeutral;
window.setPanelControlled = setPanelControlled;
window.setMaskEnabled = setMaskEnabled;
window.setBlinkSpeed = setBlinkSpeed;
window.setBlinkPolicy = setBlinkPolicy;
window.setEyeOpen = setEyeOpen;
window.modifyPose = modifyPose;
window.setPupilType = setPupilType;
// 导出数据结构供调试
window.idle = idle;
window.poses = poses;
window.state = state;
