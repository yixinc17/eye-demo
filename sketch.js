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
  
  angry: {
    left: {
      upper: { x: 30, y: -140, rot: 0.35 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: -30, y: -140, rot: -0.35 },
      lower: { x: 0, y: 172, rot: 0 }
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

  sleepy: {
    left: {
      upper: { x: 0, y: -100, rot: 0 },
      lower: { x: 0, y: 130, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -100, rot: 0 },
      lower: { x: 0, y: 130, rot: 0 }
    },
    pupil: {
      scale: 0.7,
      offset: { x: 0, y: 15 },
      pattern: null
    },
    gaze: GAZE.none,
    // 眼皮循环动画（仅在 hold 阶段生效）
    eyelidAnimation: {
      upper: { range: [-100, 0], period: 5000 },
      lower: { range: [130, 69], period: 4500 }
    },
    overlay: null,
    duration: DURATION.slow
  },
  
  adore: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    pupil: {
      scale: 0.9,
      offset: { x: 0, y: 0 },
      pattern: 'calm'
    },
    gaze: GAZE.follow,
    overlay: null,
    duration: DURATION.fast
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
  }
};

// ============ 图层资源 ============
let layers = {
  left: {
    eyeball: null,      // 眼白
    pupil: null,        // 瞳孔
    pupil2: null,       // 备选瞳孔
    highlight: null,    // 高光
    eyelidUpper: null,  // 上眼皮
    eyelidLower: null,  // 下眼皮
    happyOverlay: null  // 开心覆盖图层
  },
  right: {
    eyeball: null,
    pupil: null,
    pupil2: null,
    highlight: null,
    eyelidUpper: null,
    eyelidLower: null,
    happyOverlay: null
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
  
  // Pattern 动画状态
  pattern: {
    time: 0,
    scaleOffset: 0,
    posOffset: { x: 0, y: 0 }
  },
  
  // 眼皮动画状态
  eyelidAnim: {
    active: false,
    time: 0,
    upperY: -240,
    lowerY: 172
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
    
    // 右眼图层（独立素材，不再镜像！）
    layers.right.eyeball = loadImage('assets/right_eye/eyeball.png', null, onError);
    layers.right.pupil = loadImage('assets/right_eye/pupil.png', null, onError);
    layers.right.pupil2 = loadImage('assets/right_eye/pupil2.png', null, onError);
    layers.right.highlight = loadImage('assets/right_eye/highlight.png', null, onError);
    layers.right.eyelidUpper = loadImage('assets/right_eye/lidU_R.png', null, onError);
    layers.right.eyelidLower = loadImage('assets/right_eye/lidD_R.png', null, onError);
    layers.right.happyOverlay = loadImage('assets/right_eye/happyR.png', null, onError);
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
  
  // 更新所有 poses 中的下眼皮位置
  updatePosesWithCalculatedValues();
  
  console.log('眼皮位置计算完成:', {
    '下眼皮图片高度': lidDHeight,
    '上眼皮图片高度': lidUHeight,
    '下眼皮闭合Y': eyelidCalc.lowerCloseY,
    '下眼皮张开Y': eyelidCalc.lowerOpenY,
    '上眼皮张开Y': eyelidCalc.upperOpenY
  });
}

// 更新所有 poses 中的下眼皮位置
function updatePosesWithCalculatedValues() {
  for (let poseName in poses) {
    const pose = poses[poseName];
    
    // 更新 left.lower
    if (pose.left && pose.left.lower) {
      pose.left.lower.y = eyelidCalc.lowerOpenY;
    }
    
    // 更新 right.lower（如果独立定义）
    if (pose.right && pose.right.lower) {
      pose.right.lower.y = eyelidCalc.lowerOpenY;
    }
  }
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
  updatePupilFromMouse();    // 使用 follow + offset + pattern
  updateOverlay();
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
  
  // 6. 覆盖图层 (如 happyL) - 在眼皮之上、遮罩之内
  if (layer.happyOverlay && state.overlay.active) {
    push();
    tint(255, state.overlay.opacity);
    const overlayData = overlays[state.overlay.id] || { scale: 1.0 };
    image(layer.happyOverlay, 0, 0, s * overlayData.scale, s * overlayData.scale);
    noTint();
    pop();
    // 调试
    if (side === 'left' && frameCount % 60 === 0) {
      console.log('Overlay:', state.overlay.phase, 'opacity:', state.overlay.opacity.toFixed(0));
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
  
  state.targetPupil.x = baseX;
  state.targetPupil.y = baseY;
}

// ============ 眼皮动画更新 ============
function updateEyelidAnimation() {
  // idle 状态没有眼皮动画
  if (state.current === 'idle') {
    state.eyelidAnim.active = false;
    return;
  }
  
  const pose = poses[state.current];
  if (!pose || !pose.eyelidAnimation) {
    state.eyelidAnim.active = false;
    return;
  }
  
  // 只在过渡完成后才启动眼皮动画
  if (state.transition.active) {
    state.eyelidAnim.active = false;
    state.eyelidAnim.time = 0;
    return;
  }
  
  state.eyelidAnim.active = true;
  const anim = pose.eyelidAnimation;
  state.eyelidAnim.time += deltaTime;
  
  // 上眼皮动画
  if (anim.upper) {
    const phase = (state.eyelidAnim.time % anim.upper.period) / anim.upper.period;
    const wave = (1 - cos(phase * TWO_PI)) / 2;
    const [minY, maxY] = anim.upper.range;
    state.eyelidAnim.upperY = lerp(minY, maxY, wave);
  }
  
  // 下眼皮动画
  if (anim.lower) {
    const phase = (state.eyelidAnim.time % anim.lower.period) / anim.lower.period;
    const wave = (1 - cos(phase * TWO_PI)) / 2;
    const [minY, maxY] = anim.lower.range;
    state.eyelidAnim.lowerY = lerp(minY, maxY, wave);
  }
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

// ============ 平滑更新 ============
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
  
  // 如果当前不是 idle，需要先 out 再 in（两段式）
  if (state.current !== 'idle') {
    // 先过渡回 idle，然后排队进入新 pose
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
// 点击眨眼已禁用，改用 blinkPolicy 按钮
// function mousePressed() {
//   if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
//     triggerBlink();
//   }
// }

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
