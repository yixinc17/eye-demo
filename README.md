prototype testing: https://yixinc17.github.io/eye-demo/
# eye-demo
adore，expectant，imprint；

caring，sad，worried；

angry；

calm，daze；

confused，thinking，curious；

enjoy；

observe；

relaxed；

scared；

wink；

happy，tsundere（同为特殊表情，需特制图层，无眼皮参与）；

idle combo；

lookaround；

sleepy，sleep；

wakeup，wokeupwithastart；

# **眼睛表情系统大纲（v0.1 ）**

0. 目标
用**图层 + 参数 + 少量特制素材（overlay/特殊眼皮图）**实现可组合、可扩展的眼睛表情系统，支持：
- 网页 Demo 快速验证
- 后续迁移到 LVGL


---

1. 渲染图层结构（从下到上）

1. eyeball（眼白底图，固定）
2. pupil（瞳孔/虹膜：位置由 gazeBehavior 控制，尺寸由 pupilScale/呼吸pattern控制）
3. highlight（高光：跟随瞳孔，幅度较小）
4. overlay（可选）（符号/星星眼/泪光/发光/imprint 等，可带动画，可指定层级）
5. eyelidLower（下眼皮：平移 + 可选旋转，控制 pose）
6. eyelidUpper（上眼皮：平移 + 可选旋转，控制 pose）


---

2. 表情 = Pose + GazeBehavior + Overlay


A. Pose（静态姿态 + 时序，主要是上下眼皮+眼珠大小）


决定“看起来像什么脸”，包括：
- openPose：该表情“睁眼时”的眼皮姿态（upper/lower 的 x/y/rot）
- closePose（可选）：该表情“闭眼时”的眼皮姿态（用于眨眼/进入闭眼）
- pupilScaleBase：瞳孔基础大小
- timing（默认可覆写）：in / hold / out（进入、保持、退出）


✅ Idle ：
Idle 是一组“低强度表情/动作组合”的集合（idle1/2/3/4），本质上仍然是 Pose + GazeBehavior +（可选）Overlay，只是它会在无交互时循环触发，并带有轻微 pattern（呼吸/微扫视/偶发眨眼）。

---

B. GazeBehavior（眼珠行为规则）


决定“眼珠怎么动”，用于区分相似表情（sad/caring/worried 等）：
- authority（每个表情一个参数）
  - interactive：以用户/目标为主（强跟随）
  - blend：表情自带动作 + 轻度跟随
  - emotion：完全表情自带（神游/思考/睡眠/序列期间）
- followGain：[-1, 1]（正跟随/0 不跟随/负反向）
- clampX / clampY：眼珠最大偏移（目前是统一的，特殊表情可特殊调整）
- pattern（可选）：自带眼珠 puipil动作（不仅是位移，也可以是 jitter/scan/pingpong 等）
  - 例：breathing（快慢呼吸）anxious_loop（担心左右循环）、up_scan（思考上视慢扫）、micro_jitter（轻微颤动）


---

C. Overlay（叠加层）


只在 Pose+Gaze 不够表达时使用：
- overlay_layer：叠加图层（imprint / happy/ tsundere/特效符号 / 泪光等）
  - overlay 可带 in/hold/out 与 scale/alpha 动画


---

3. 眨眼 Blink：系统轨道，不是表情本体

- blink 是独立轨道，默认全局存在
- 每个表情只设置 blinkPolicy：off | low | normal | high | micro_only
- pose 阶段的眨眼（待定，目前策略是 pose 阶段眨眼禁用）
  - 为避免“angry 旋转眼皮 + 默认眨眼很怪”：
  - blink 必须基于该表情的 openPose→closePose 插值

如果某表情不希望眨眼（angry 瞪眼、enjoy、sleep、wink），直接 blinkPolicy=off。

---

4. 表情切换与打断机制（统一调度，不写死 if-else）


目标：不硬闪、不拖延。

每个表情定义：

- interrupt：soft | hard | never（待定，目前统一为 soft）
  - soft：允许打断，但会走短 out（更自然）
  - hard：立即切入（待梳理是否需要）
- bridge（可选）：只在“特定来源→特定去向”需要时使用（待梳理）
  - 例：daze→wakeup→idle；sleepy→sleep；sleep→wakeup



---

5. 两类表情：普通 Pose vs 序列 Sequence


A. 普通表情（绝大多数）
- pose 关键帧
- blinkPolicy = off（避免冲突）
- timing：in/hold/out（可覆写）
- gaze：authority + followGain + clamp + pattern（可选）
- overlay（可选）
B. 序列表情（sleepy / wakeup 等）
- 用关键帧序列描述多段动作：
  - keyframes：{time, pose(open/close/offset), pupil, gaze, overlay…}
- 序列期间通常：
  - gazeAuthority = emotion
  - blinkPolicy = off（避免冲突）

sleepy 这种“眼皮上下上下多次”的表情就放这里；普通表情仍然是 base→target 的一次过渡。

---

7. 当前验证优先级（v0.1）


优先实现并跑通 demo：
1. Pose 期间眨眼可行性（blinkPolicy + openPose→closePose 插值）✅暂时禁用
2. 表情切换（soft/hard interrupt + 可选 bridge）✅统一soft
3. overlay（imprint / happy 或 tsundere 的特殊层级验证） ✅已验证 happy
4. sleepy 序列（keyframes）
5. idle 系统（无交互下的轻量循环：呼吸/微扫视/偶发眨眼）

---

# 表情参数详解

## 基础参考值

| 状态 | upper.y | lower.y | 说明 |
|------|---------|---------|------|
| 完全睁开 | -240 | 172 | idle.openPose |
| 完全闭合 | 0 | 69 | idle.closePose |

| 预设 | 值 |
|------|-----|
| `DURATION.fast` | 200ms |
| `DURATION.normal` | 400ms |
| `DURATION.slow` | 800ms |

| Gaze 模式 | 值 | 说明 |
|-----------|-----|------|
| `GAZE.follow` | 1 | 跟随鼠标 |
| `GAZE.none` | 0 | 不跟随 |
| `GAZE.reverse` | -1 | 反向跟随 |

---

## 表情参数总表

### 特殊表情（带 overlay）

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | pupil.offset | gaze | duration | overlay |
|------|---------|-----------|---------|-------------|--------------|------|----------|---------|
| **happy** | -220 | 0 | 172 | 0.75 | (0,0) | none | fast | happy_L |
| **happy2** | -240 | 0 | 120 | 0.9 | (0,0) | none | fast | null（pupil keyframes loop） |
| **imprint** | -240 | 0 | 120 | 0.95 | (0,0) | follow | normal | imprint_L |
| **tsundere** | -240 | 0 | 172 | 0.7 | (10,0) | none | normal | tsundere_L |

### 喜爱类

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | pupil.offset | gaze | duration | 备注 |
|------|---------|-----------|---------|-------------|--------------|------|----------|------|
| **adore** | -240 | 0 | 120 | 0.9 | (0,0) | follow | fast | 大瞳孔 |
| **expectant** | -240 | 0 | 100 | 0.85 | (0,0) | follow | normal | 下眼皮上抬 |

### 关心/忧虑类

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | pupil.offset | gaze | duration | pattern |
|------|---------|-----------|---------|-------------|--------------|------|----------|---------|
| **caring** | -150 | ±0.1 | 172 | 0.7 | (0,5) | follow | normal | calm |
| **sad** | -100 | ±0.2 | 172 | 0.65 | (0,15) | none | slow | calm |
| **worried** | -150 | ±0.2 | 172 | 0.6 | (0,10) | none | normal | anxious |

### 愤怒类

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | gaze | duration | 备注 |
|------|---------|-----------|---------|-------------|------|----------|------|
| **angry** | -140 | ±0.35 | 100 | 0.6 | reverse | normal | upper.x: ±30, pattern: anxious |

### 平静/发呆类

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | gaze | duration | pattern |
|------|---------|-----------|---------|-------------|------|----------|---------|
| **calm** | -140 | ±0.15 | 172 | 0.7 | none | slow | calm |
| **daze** | -100 | ±0.15 | 172 | 0.65 | none | slow | calm |

### 思考类

| 表情 | L.upper.y | R.upper.y | L.rot | R.rot | L.lower.y | R.lower.y | pupil.scale | pupil.offset | gaze | duration |
|------|-----------|-----------|-------|-------|-----------|-----------|-------------|--------------|------|----------|
| **confused** | -120 | -150 | -0.2 | 0.1 | 110 | 120 | 0.7 | (10,-5) | none | normal |
| **thinking** | -140 | -200 | -0.1 | 0 | 120 | 120 | 0.7 | (15,-15) | none | normal |
| **curious** | -150 | -240 | 0.4 | 0 | 100 | 100 | 0.8 | (15,-15) | follow | fast |

### 享受/观察/放松类

| 表情 | upper.y | upper.rot | lower.y | lower.rot | pupil.scale | gaze | duration | pattern |
|------|---------|-----------|---------|-----------|-------------|------|----------|---------|
| **enjoy** | -50 | ±0.3 | 69 | ±0.3 | 0.75 | none | slow | calm |
| **observe** | -100 | ±0.15 | 100 | 0 | 0.7 | follow | slow | neutral |
| **relaxed** | -50 | ±0.2 | 69 | ±0.2 | 0.7 | none | slow | calm |
| **proud** | -130 | ±0.2 | 120 | 0 | 0.72 | none | normal | neutral |

### 惊吓类

| 表情 | upper.y | upper.rot | lower.y | pupil.scale | gaze | duration | pattern |
|------|---------|-----------|---------|-------------|------|----------|---------|
| **scared** | -240 | ±0.1 | 172 | 0.5 | none | fast | panic |

### 眨眼类

| 表情 | L.upper.y | R.upper.y | L.rot | R.rot | L.lower.y | R.lower.y | lower.rot | pupil.scale | gaze | duration |
|------|-----------|-----------|-------|-------|-----------|-----------|-----------|-------------|------|----------|
| **wink_left** | -100 | -70 | 0.3 | -0.3 | 172 | 60 | R:-0.3 | 0.75 | none | normal |
| **wink_right** | -70 | -100 | 0.3 | -0.3 | 60 | 172 | L:0.3 | 0.75 | none | normal |

### 看向类

| 表情 | upper.y | lower.y | pupil.scale | pupil.offset | gaze | duration |
|------|---------|---------|-------------|--------------|------|----------|
| **look_left** | -240 | 172 | 0.7 | (25, 0) | none | normal |
| **look_right** | -240 | 172 | 0.7 | (-25, 0) | none | normal |
| **look_around** | -240 | 172 | 0.7 | (0, 0) | none | normal（hold 5000ms + sine_x） |

### 触摸变体（摸哪边看哪边）

| 表情 | 基于 | pupil.offset | gaze | 说明 |
|------|------|--------------|------|------|
| **curious_left** | curious | (25, -15) | none | 好奇看左 |
| **curious_right** | curious | (-25, -15) | none | 好奇看右 |
| **confused_left** | confused | (25, -5) | none | 疑惑看左 |
| **confused_right** | confused | (-25, -5) | none | 疑惑看右 |
| **angry_left** | angry | (25, 0) | none | 生气看左 |
| **angry_right** | angry | (-25, 0) | none | 生气看右 |
| **enjoy_left** | enjoy | (25, 5) | none | 享受看左 |
| **enjoy_right** | enjoy | (-25, 5) | none | 享受看右 |

### 睡眠类

**sleep** - 完整睡眠流程（正弦波循环 → 闭眼呼吸）

```
入场 → 眼皮开合循环(10秒) → 闭眼呼吸(无限)
```

| 阶段 | 类型 | upper | lower | 时长 |
|------|------|-------|-------|------|
| 阶段1 | 正弦波循环 | -100↔0 (周期5s) | 130↔69 (周期4.5s) | 10秒 |
| 阶段2 | 正弦波循环 | -50↔-40 (周期4s) | 69↔60 (周期4s) | 无限 |

**新增 eyelidAnimation 参数：`phaseDuration` + `afterLoop`**
```javascript
eyelidAnimation: {
  upper: { range: [-100, 0], period: 5000 },
  lower: { range: [130, 69], period: 4500 },
  phaseDuration: 10000,  // 第一阶段播放10秒
  afterLoop: {           // 然后切换到第二阶段
    upper: { range: [-50, -40], period: 4000 },
    lower: { range: [69, 60], period: 4000 }
  }
}
```

### 醒来类

| 表情 | upper.y | lower.y | pupil.scale | gaze | duration | 特殊属性 |
|------|---------|---------|-------------|------|----------|----------|
| **wakeup** | -240 | 172 | 0.7 | follow | 1200ms | direct, allowedFrom:[sleep,daze], autoReturnToIdle |
| **startled** | -240 | 172 | 0.5 | none | normal | direct, keyframes动画, pattern:panic |

---

## 特殊属性详解

### 1. `eyelidAnimation` - 眼皮动画

#### 类型A：循环动画（正弦波）

```javascript
eyelidAnimation: {
  upper: { range: [-100, 0], period: 5000 },
  lower: { range: [130, 69], period: 4500 }
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `upper.range` | `[起点, 终点]` | 上眼皮 y 值的摆动范围 |
| `upper.period` | `number` (ms) | 一个完整周期的时长 |
| `lower.range` | `[起点, 终点]` | 下眼皮 y 值的摆动范围 |
| `lower.period` | `number` (ms) | 一个完整周期的时长 |

**运动公式**：
```
phase = (time % period) / period        // 0~1
wave = (1 - cos(phase * 2π)) / 2        // 0~1 正弦波
y = lerp(range[0], range[1], wave)      // 在范围内插值
```

**sleepy 示例**：上眼皮 y 在 -100 ↔ 0 之间摆动（周期5s），下眼皮 y 在 130 ↔ 69 之间摆动（周期4.5s）

**sleep 示例**：上眼皮 y 在 -50 ↔ -40 之间微动（周期4s），闭眼状态的微小呼吸感

#### 类型B：关键帧动画

```javascript
eyelidAnimation: {
  type: 'keyframes',
  keyframes: [
    { upper: { y: -50 }, lower: { y: 80 }, duration: 150 },
    { upper: { y: -240 }, lower: { y: 172 }, duration: 350 }
  ],
  loop: false
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `'keyframes'` | 标识为关键帧类型 |
| `keyframes` | `Array` | 关键帧数组，按顺序执行 |
| `keyframes[].upper.y` | `number` | 该帧上眼皮目标 y 值 |
| `keyframes[].lower.y` | `number` | 该帧下眼皮目标 y 值 |
| `keyframes[].duration` | `number` (ms) | 到达该帧的过渡时长 |
| `loop` | `boolean` | 是否循环播放 |

**startled 示例**：帧1 微闭眼(150ms) → 帧2 快速睁大(350ms)

---

### 2. `holdDuration` - 保持时长

| 值 | 说明 |
|------|------|
| `number` | 指定毫秒数后自动离开 |
| `null` | 无限保持，需手动触发其他表情 |
| `undefined` | 使用默认值 2000ms |

---

### 3. `nextPose` - 后继表情

| 情况 | 行为 |
|------|------|
| 有 `nextPose` | holdDuration 结束后自动调用 `setEmotion(nextPose)` |
| 无 `nextPose` | 自动回到 `idle` |

---

### 4. `transitionMode` - 过渡模式

| 模式 | 路径 |
|------|------|
| `'direct'` | 当前 pose → 目标 pose（一步到位） |
| 默认 | 当前 pose → idle → 目标 pose（两段式） |

---

### 5. `allowedFrom` - 来源限制

| 行为 | 说明 |
|------|------|
| 当前状态在列表中 | 允许进入 |
| 当前状态不在列表中 | 忽略并打印警告 |
| 未设置 | 允许从任何状态进入 |

---

### 6. `autoReturnToIdle` - 自动返回

| 值 | 行为 |
|------|------|
| `true` | 过渡完成后立即切换到 idle（不执行 hold） |
| `false`/未设置 | 进入 hold 阶段 |

---

### 7. `pattern` - 瞳孔呼吸动画

| Pattern | 效果 |
|---------|------|
| `'calm'` | 缓慢呼吸感，scale ±0.02 |
| `'neutral'` | 轻微缩放 |
| `'anxious'` | 快速微颤 |
| `'panic'` | 剧烈颤抖 |
| `null` | 无动画 |

---

## 表情流程示意

```
setEmotion(X)
     │
     ▼
┌─────────────┐
│ allowedFrom │ ──不通过──▶ 忽略，打印警告
│   检查      │
└─────────────┘
     │通过
     ▼
┌─────────────┐     direct      ┌─────────────┐
│transitionMode├───────────────▶│  Transition  │
└─────────────┘                 │  当前→目标   │
     │默认                       └─────────────┘
     ▼                                │
┌─────────────┐                       ▼
│  Transition  │               ┌─────────────┐
│  当前→idle   │               │eyelidAnimation│──▶ 眼皮动画
└─────────────┘               └─────────────┘
     │                                │
     ▼                                ▼
┌─────────────┐     autoReturn  ┌─────────────┐
│  Transition  │◀───────────────│   过渡完成   │
│  idle→目标   │      =true     └─────────────┘
└─────────────┘                       │false
                                      ▼
                               ┌─────────────┐
                               │    Hold     │
                               │ holdDuration │
                               └─────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │ nextPose ? → setEmotion() │
                        │ else → setEmotion('idle') │
                        └──────────────────────────┘
```

---
