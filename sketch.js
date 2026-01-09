// Pawbie Eye Animation Demo - 表情系统 v0.1
// 基于 Pose + GazeBehavior + Overlay 的可组合表情系统

// ============ 基础配置 ============
const config = {
  eyeSize: 240,           // 单眼尺寸
  eyeGap: 240,            // 两眼间隔
  canvasWidth: 720,       // 画布宽度
  canvasHeight: 400,      // 画布高度
  useImages: true,        // 启用图片图层
  useCircleMask: true,    // 启用圆形遮罩
  maskRadius: 0.45,       // 遮罩半径 (相对于 eyeSize)
  pupilMaxOffset: 30,     // 瞳孔最大偏移
  highlightFollow: 0.3    // 高光跟随系数
};

// ============ 动态计算的位置 ============
// 这些值会在 setup() 中根据实际图片尺寸更新
const eyelidCalc = {
  // 下眼皮闭合时 y: eyeball半径 - 下眼皮图片高度/2
  lowerCloseY: 69,    // 默认值，会被计算覆盖
  // 下眼皮张开时 y: eyeball半径 + 下眼皮图片高度/2  
  lowerOpenY: 172,    // 默认值，会被计算覆盖
  // 上眼皮张开时 y: -(eyeball高度)，完全出画
  upperOpenY: -240    // 默认值，会被计算覆盖
};

// ============ 通用眨眼 closePose ============
// 所有表情共用的闭眼姿态（y值会在setup中动态更新）
const defaultClosePose = {
  upper: { x: 0, y: 0, rot: 0 },
  lower: { x: 0, y: 69, rot: 0 }  // 下眼皮下缘=eyeball下缘，动态计算
};

// ============ Pose 定义 ============
// 每个表情定义：眼皮(left/right)、瞳孔(pupil)、时间(timing)
const poses = {
  idle: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    pupil: {
      scale: 0.7,
      offset: { x: 0, y: 0 },
      followGain: 1.0,
      pattern: 'neutral'
    },
    timing: { in: 400, hold: -1, out: 300 }
  },
  
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
      followGain: 0.5,        // 半跟随
      pattern: null
    },
    timing: { in: 250, hold: -1, out: 300 }
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
      followGain: -1,
      pattern: 'anxious'     // 快节奏大变化
    },
    timing: { in: 500, hold: -1, out: 400 }
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
      offset: { x: 0, y: 15 },  // 瞳孔靠下
      followGain: 0,            // 不跟随
      pattern: null
    },
    timing: { in: 600, hold: -1, out: 500 }
  },
  
  sleepy: {
    left: {
      upper: { x: 0, y: -200, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -200, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    pupil: {
      scale: 0.7,
      offset: { x: 0, y: 10 },  // 瞳孔略靠下
      followGain: 0.2,          // 懒跟随
      pattern: null
    },
    timing: { in: 800, hold: -1, out: 600 }
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
      followGain: 0.8,
      pattern: 'calm'
    },
    timing: { in: 350, hold: -1, out: 300 }
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
    amplitude: 0.03,        // ±5% 中等
    period: 3000            // 3秒
  },
  anxious: {
    property: 'scale',
    amplitude: 0.05,        // ±8% 大变化
    period: 1500            // 1.5秒 快节奏
  }
};

// ============ Blink 策略 ============
const blinkPolicies = {
  off: { enabled: false, interval: [0, 0], duration: 0 },
  micro_only: { enabled: true, interval: [5000, 8000], duration: 150 },
  low: { enabled: true, interval: [4000, 7000], duration: 250 },
  normal: { enabled: true, interval: [2000, 5000], duration: 300 },
  high: { enabled: true, interval: [1000, 2500], duration: 200 }
};

// ============ Overlay 定义 ============
const overlays = {
  happy_L: {
    asset: 'happyOverlay',
    layer: 6,  // 最顶层
    scale: 1.0,  // 与 eyeball 同尺寸 240x240
    timing: { in: 500, hold: 3000, out: 500 }  // 渐入300ms, 保持3s, 渐出300ms
  }
  // 后续可添加：star_eyes, tears, heart 等
};

// ============ 表情组合定义 ============
// 表情 = Pose + GazeBehavior + BlinkPolicy + Overlay
const emotions = {
  idle: {
    pose: 'idle',
    blinkPolicy: 'normal',
    overlay: null,
    interrupt: 'soft'
  },
  happy: {
    pose: 'happy',
    blinkPolicy: 'off',
    overlay: 'happy_L',
    interrupt: 'soft'
  },
  sad: {
    pose: 'sad',
    blinkPolicy: 'low',
    overlay: null,
    interrupt: 'soft'
  },
  angry: {
    pose: 'angry',
    blinkPolicy: 'off',
    overlay: null,
    interrupt: 'soft'
  },
  sleepy: {
    pose: 'sleepy',
    blinkPolicy: 'micro_only',
    overlay: null,
    interrupt: 'soft'
  },
  adore: {
    pose: 'adore',
    blinkPolicy: 'low',
    overlay: null,
    interrupt: 'soft'
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

// ============ 运行时状态 ============
let state = {
  // 当前表情 ID
  emotion: 'idle',
  
  // 瞳孔位置（实时）
  pupil: { x: 0, y: 0 },
  targetPupil: { x: 0, y: 0 },
  
  // 眼睛开合度 (0=闭眼, 1=全开)
  eyeOpen: { left: 1, right: 1 },
  targetEyeOpen: { left: 1, right: 1 },
  
  // 眼皮姿态（实时计算值）
  eyelid: {
    left: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    },
    right: {
      upper: { x: 0, y: -240, rot: 0 },
      lower: { x: 0, y: 172, rot: 0 }
    }
  },
  
  // 瞳孔缩放
  pupilScale: 0.7,
  targetPupilScale: 0.7,
  
  // 眨眼状态
  blink: {
    active: false,
    timer: 0,
    nextTime: 3000,
    progress: 0  // 0-1，用于 pose→closePose 眨眼插值
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
    progress: 0,  // 0-1 过渡进度
    fromPose: 'idle',  // 过渡起始 Pose 名
    toPose: 'idle',    // 过渡目标 Pose 名
    fromPupilScale: 0.7
  },
  
  // Pattern 动画状态
  pattern: {
    time: 0,              // 动画时间
    scaleOffset: 0,       // 缩放偏移
    posOffset: { x: 0, y: 0 }  // 位置偏移
  }
};

let time = 0;
let followMouse = true;
let manualPupil = { x: 0, y: 0 };
let panelControlled = false;

// ============ Pose 辅助函数 ============

// 获取指定眼睛的 Pose 数据
function getPoseForSide(poseName, side) {
  const pose = poses[poseName];
  if (!pose) return poses.idle[side];
  return pose[side];
}

// 在 pose 和 defaultClosePose 之间插值（用于眨眼）
function interpolatePose(poseName, side, blinkProgress) {
  const open = getPoseForSide(poseName, side);  // 直接获取 upper/lower
  const close = defaultClosePose;
  
  // blinkProgress: 0=全开, 1=全闭
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

// 计算当前眼皮姿态（考虑眨眼）
function calculateEyelidPose(side) {
  const blinkProgress = state.blink.progress;
  
  // 如果正在过渡，在两个 Pose 之间插值
  if (state.transition.active) {
    const fromPose = getPoseForSide(state.transition.fromPose, side);
    const toPose = getPoseForSide(state.transition.toPose, side);
    const t = state.transition.progress;
    
    // 在 fromPose 和 toPose 之间插值
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
  
  // 非过渡时，使用当前 Pose + 眨眼插值
  const emotionData = emotions[state.emotion];
  const poseName = emotionData.pose;
  return interpolatePose(poseName, side, blinkProgress);
}

// ============ 表情序列系统 ============
let emotionSequence = {
  active: false,
  emotions: [],      // 表情序列 ['happy', 'idle']
  durations: [],     // 每个表情持续时间 [800, 1200]
  currentIndex: 0,
  timer: 0
};

function startEmotionSequence(emotions, durations) {
  emotionSequence.active = true;
  emotionSequence.emotions = emotions;
  emotionSequence.durations = durations;
  emotionSequence.currentIndex = 0;
  emotionSequence.timer = 0;
}

function updateEmotionSequence() {
  if (!emotionSequence.active) return;
  
  emotionSequence.timer += deltaTime;
  
  // 检查是否需要切换到下一个表情
  let currentDuration = emotionSequence.durations[emotionSequence.currentIndex];
  
  if (emotionSequence.timer >= currentDuration) {
    emotionSequence.timer = 0;
    emotionSequence.currentIndex++;
    
    // 检查是否还有下一个表情
    if (emotionSequence.currentIndex < emotionSequence.emotions.length) {
      let nextEmotion = emotionSequence.emotions[emotionSequence.currentIndex];
      state.emotion = nextEmotion;
      // 直接应用目标，不再触发序列
      applyEmotionTargetsWithoutSequence(nextEmotion);
    } else {
      // 序列结束
      emotionSequence.active = false;
    }
  }
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

function applyEmotionTargetsWithoutSequence(emotionId) {
  // 不触发序列的表情应用（避免无限循环）
  
  // 特殊处理 fadeOut
  if (emotionId === 'fadeOut') {
    state.overlay.targetOpacity = 0;
    state.overlay.active = false;
    return;
  }
  
  const emotionData = emotions[emotionId];
  if (!emotionData) return;
  
  state.emotion = emotionId;
  
  const pose = poses[emotionData.pose];
  state.targetPupilScale = pose.pupil.scale;
  
  // 清理 overlay（如果切换到无 overlay 的表情）
  if (!emotionData.overlay) {
    state.overlay.targetOpacity = 0;
  }
  
  startEmotionTransition(pose.timing.in);
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
  
  // 更新 defaultClosePose
  defaultClosePose.lower.y = eyelidCalc.lowerCloseY;
  
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
}

// ============ 主循环 ============
function draw() {
  time += deltaTime;
  
  background('#fff5f5');
  
  // 更新状态
  handleBlink();
  updatePattern();           // 更新呼吸感等 pattern
  updatePupilFromMouse();    // 使用 followGain + offset + pattern
  updateEmotionSequence();
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
  
  // ===== 圆形遮罩 =====
  if (config.useCircleMask) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(0, 0, s * config.maskRadius, 0, TWO_PI);
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
  
  // ===== 结束圆形遮罩 =====
  if (config.useCircleMask) {
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
function handleBlink() {
  // 获取当前表情的眨眼策略
  const emotionData = emotions[state.emotion];
  const policy = blinkPolicies[emotionData.blinkPolicy];
  
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
  
  // 更新眨眼计时器
  state.blink.timer += deltaTime;
  
  // 触发自动眨眼
  if (state.blink.timer > state.blink.nextTime && !state.blink.active) {
    triggerBlink();
  }
  
  // 眨眼动画（基于 blinkPolicy 的 duration）
  if (state.blink.active) {
    let blinkTime = state.blink.timer / policy.duration;
    
    if (blinkTime < 0.5) {
      // 闭眼阶段：progress 从 0 到 1
      state.blink.progress = blinkTime * 2;
    } else if (blinkTime < 1) {
      // 睁眼阶段：progress 从 1 到 0
      state.blink.progress = 1 - (blinkTime - 0.5) * 2;
    } else {
      // 眨眼结束
      state.blink.active = false;
      state.blink.timer = 0;
      state.blink.progress = 0;
      state.blink.nextTime = random(policy.interval[0], policy.interval[1]);
    }
  }
}

function triggerBlink() {
  const emotionData = emotions[state.emotion];
  const policy = blinkPolicies[emotionData.blinkPolicy];
  if (!policy.enabled) return;
  
  state.blink.active = true;
  state.blink.timer = 0;
  state.blink.progress = 0;
}

// ============ 鼠标跟随 ============
function updatePupilFromMouse() {
  // 获取当前 Pose 的 pupil 设置
  const emotionData = emotions[state.emotion];
  const pose = poses[emotionData ? emotionData.pose : 'idle'];
  const pupilConfig = pose.pupil;
  
  // 基础位置 = pose 定义的 offset
  let baseX = pupilConfig.offset.x;
  let baseY = pupilConfig.offset.y;
  
  // 鼠标跟随（乘以 followGain）
  if (followMouse && pupilConfig.followGain !== 0) {
    let centerX = config.canvasWidth / 2;
    let centerY = config.canvasHeight / 2;
    
    let mx = mouseX - centerX;
    let my = mouseY - centerY;
    
    let maxOffset = config.pupilMaxOffset;
    let gain = pupilConfig.followGain;
    
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

// ============ Pattern 动画更新 ============
function updatePattern() {
  const emotionData = emotions[state.emotion];
  const pose = poses[emotionData ? emotionData.pose : 'idle'];
  const patternName = pose.pupil.pattern;
  
  if (!patternName || !patterns[patternName]) {
    // 无 pattern，重置偏移
    state.pattern.scaleOffset = 0;
    state.pattern.posOffset.x = 0;
    state.pattern.posOffset.y = 0;
    return;
  }
  
  const pattern = patterns[patternName];
  state.pattern.time += deltaTime;
  
  // 计算周期内的进度 (0-1)
  const phase = (state.pattern.time % pattern.period) / pattern.period;
  // 单向波 (0 到 1)：从基础值平滑变大再变回来
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
    }
  } else {
    // 非过渡时使用 lerp
    state.pupilScale = lerp(state.pupilScale, state.targetPupilScale, speed);
  }
  
  // 覆盖图层透明度
  state.overlay.opacity = lerp(state.overlay.opacity, state.overlay.targetOpacity, speed * 2.0);
  
  // 检查覆盖图层淡出完成
  if (state.overlay.targetOpacity === 0 && state.overlay.opacity < 1) {
    state.overlay.opacity = 0;
    state.overlay.active = false;
  }
}

// ============ 启动表情过渡 ============
function startEmotionTransition(fromPoseName, toPoseName, duration) {
  // 记录当前值作为过渡起点
  state.transition.fromPupilScale = state.pupilScale;
  state.transition.fromPose = fromPoseName;
  state.transition.toPose = toPoseName;
  
  // 设置过渡参数
  state.transition.duration = duration;
  state.transition.timer = 0;
  state.transition.progress = 0;
  state.transition.active = true;
}

// ============ 表情设置 (数据驱动) ============
function setEmotion(emotionId) {
  console.log('setEmotion called:', emotionId);
  const emotionData = emotions[emotionId];
  if (!emotionData) {
    console.warn(`Unknown emotion: ${emotionId}`);
    return;
  }
  
  panelControlled = false;
  
  // 记录当前 Pose 作为过渡起点
  const currentEmotionData = emotions[state.emotion];
  const fromPoseName = currentEmotionData ? currentEmotionData.pose : 'idle';
  const toPoseName = emotionData.pose;
  
  // 获取目标 Pose 和 timing
  const pose = poses[toPoseName];
  const transitionTime = pose.timing.in;
  
  // 处理 overlay（由 updateOverlay 函数控制阶段）
  if (emotionData.overlay) {
    state.overlay.active = true;
    state.overlay.id = emotionData.overlay;
    state.overlay.phase = 'in';
    state.overlay.timer = 0;
    state.overlay.opacity = 0;
  } else if (state.overlay.active) {
    // 切换到无 overlay 的表情时清理
    state.overlay.active = false;
    state.overlay.phase = 'none';
    state.overlay.opacity = 0;
  }
  
  // 设置新表情
  state.emotion = emotionId;
  
  // 设置目标值（从 Pose.pupil 读取）
  state.targetPupilScale = pose.pupil.scale;
  
  // 启动过渡动画（从当前 Pose 到新 Pose）
  if (transitionTime > 0) {
    startEmotionTransition(fromPoseName, toPoseName, transitionTime);
  }
}

// 兼容旧代码的 applyEmotionTargets
function applyEmotionTargets() {
  const emotionData = emotions[state.emotion];
  if (!emotionData) return;
  
  const pose = poses[emotionData.pose];
  state.targetPupilScale = pose.pupil.scale;
  startEmotionTransition(pose.timing.in);
}

// ============ 调试信息 ============
function drawDebugInfo() {
  fill(100);
  noStroke();
  textSize(12);
  textAlign(LEFT);
  text(`Emotion: ${state.emotion}`, 10, 20);
  text(`Blink: ${state.blink.progress.toFixed(2)}`, 10, 35);
  text(`Pupil: (${state.pupil.x.toFixed(1)}, ${state.pupil.y.toFixed(1)})`, 10, 50);
  text(`Pupil Scale: ${state.pupilScale.toFixed(2)}`, 10, 65);
}

// ============ 交互 ============
function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    triggerBlink();
  }
}

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
  state.emotion = 'idle';
  state.targetPupil = { x: 0, y: 0 };
  state.pupil = { x: 0, y: 0 };
  manualPupil = { x: 0, y: 0 };
  state.targetPupilScale = 0.7;
  state.pupilScale = 0.7;
  state.blink.progress = 0;
  state.blink.active = false;
  state.overlay.opacity = 0;
  state.overlay.targetOpacity = 0;
  state.overlay.active = false;
  followMouse = true;
}

function setPanelControlled(enabled) {
  panelControlled = enabled;
}

// ============ 遮罩控制 ============
function setMaskEnabled(enabled) {
  config.useCircleMask = enabled;
}

function setCircleMask(enabled) {
  config.useCircleMask = enabled;
}

function setMaskRadius(radius) {
  config.maskRadius = radius;
}

// ============ 眼距控制 ============
function setEyeGap(gap) {
  config.eyeGap = gap;
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
window.setCircleMask = setCircleMask;
window.setMaskRadius = setMaskRadius;
window.setEyeGap = setEyeGap;
window.setBlinkSpeed = setBlinkSpeed;
window.setEyeOpen = setEyeOpen;
window.modifyPose = modifyPose;
window.setPupilType = setPupilType;
// 导出数据结构供调试
window.poses = poses;
window.emotions = emotions;
window.state = state;
