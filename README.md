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

## **0. 目标**

用**图层 + 参数 + 少量特制素材（overlay/特殊眼皮图）**实现可组合、可扩展的眼睛表情系统，支持：

- PC 网页 Demo 快速验证
- 后续迁移到 LVGL（最终可把 JSON 编译为 C 数据结构）

---

## **1) 渲染图层结构（从下到上）**

1. **eyeball**（眼白底图，固定）
2. **pupil**（瞳孔/虹膜：位置由 gaze 控制，尺寸由 pupilScale/呼吸控制）
3. **highlight**（高光：跟随瞳孔，幅度较小）
4. **overlay（可选）**（符号/星星眼/泪光/发光/imprint 等，可带动画，可指定层级）
5. **eyelidLower**（下眼皮：平移 + 可选旋转）
6. **eyelidUpper**（上眼皮：平移 + 可选旋转）

---

## **2) 表情 = Pose + GazeBehavior + Overlay**

### **A. Pose（静态姿态 + 时序）**

决定“看起来像什么脸”，包括：

- **openPose**：该表情“睁眼时”的眼皮姿态（upper/lower 的 x/y/rot）
- **closePose（可选）**：该表情“闭眼时”的眼皮姿态（用于眨眼/进入闭眼）
- **pupilScaleBase**：瞳孔基础大小
- **timing（默认可覆写）**：in / hold / out（进入、保持、退出）

✅ **Idle 怎么办？**

Idle 是一组“低强度表情/动作组合”的集合（idle1/2/3/4），本质上仍然是 Pose + GazeBehavior +（可选）Overlay，只是它会在无交互时循环触发，并带有轻微 pattern（呼吸/微扫视/偶发眨眼）。

---

### **B. GazeBehavior（眼珠行为规则）**

决定“眼珠怎么动”，用于区分相似表情（sad/caring/worried 等）：

- **authority**（每个表情一个参数）
    - interactive：以用户/目标为主（强跟随）
    - blend：表情自带动作 + 轻度跟随
    - emotion：完全表情自带（神游/思考/睡眠/序列期间）
- **followGain**：[-1, 1]（正跟随/0 不跟随/负反向）
- **clampX / clampY**：眼珠最大偏移
- **pattern（可选）**：自带眼球动作（不仅是位移，也可以是 jitter/scan/pingpong 等）
    - 例：anxious_loop（担心左右循环）、up_scan（思考上视慢扫）、micro_jitter（轻微颤动）

---

### **C. Overlay（叠加层）**

只在 Pose+Gaze 不够表达时使用：

- **replace_pupil**：替换瞳孔/虹膜贴图
- **overlay_layer**：叠加图层（imprint / 特效符号 / 泪光等）
    - overlay 可带 in/hold/out 与 scale/alpha 动画

---

## **3) 眨眼 Blink：系统轨道，不是表情本体**

- blink 是独立轨道，默认全局存在
- 每个表情只设置 **blinkPolicy**：off | low | normal | high | micro_only
- 为避免“angry 旋转眼皮 + 默认眨眼很怪”：
    - blink 必须基于该表情的 **openPose→closePose** 插值（不回默认闭眼姿态）

✅ 如果某表情不希望眨眼（angry 瞪眼、enjoy、sleep、wink），直接 blinkPolicy=off。

---

## **4) 表情切换与打断机制（统一调度，不写死 if-else）**

目标：**不硬闪、不拖延**。

### **每个表情定义：**

- **interrupt**：soft | hard | never
    - soft：允许打断，但会走短 out（更自然）
    - hard：立即切入（待梳理是否需要）
- **bridge（可选）**：只在“特定来源→特定去向”需要时使用
    - 例：daze→wakeup→idle；sleepy→sleep；sleep→wakeup

### 

---

## **5) 两类表情：普通 Pose vs 序列 Sequence**

### **A. 普通表情（绝大多数）**

- openPose（必要时 closePose）
- timing：in/hold/out（可覆写）
- gaze：authority + followGain + clamp + pattern（可选）
- overlay（可选）

### **B. 序列表情（sleepy / wakeup 等）**

- 用关键帧序列描述多段动作：
    - keyframes：{time, pose(open/close/offset), pupil, gaze, overlay…}
- 序列期间通常：
    - gazeAuthority = emotion
    - blinkPolicy = off（避免冲突）

 sleepy 这种“眼皮上下上下多次”的表情就放这里；普通表情仍然是 base→target 的一次过渡。

---

## **6) 数据组织方式（避免维护地狱）**

- 可选：将眼皮几何相近的表情归为同一个 **Base Pose**（后续优化项，v0.1 可先不强制）
- 呼吸只用三档 profile：slow / normal / fast（程序映射 min/max/period）
- 目标：表情数据以“引用 + 少量覆写”为主，避免每个表情一堆数字

---

## **7) Demo 与 LVGL 落地策略（后续）**

- 网页 Demo：JSON 直接驱动，验证逻辑与手感
- LVGL：不建议 MCU 运行时读 JSON；建议脚本把 JSON 编译为 C 结构体 + 资源表

---

## **8) 当前验证优先级（v0.1）**

优先实现并跑通 demo：

1. **Pose 期间眨眼可行性**（blinkPolicy + openPose→closePose 插值）
2. **表情切换**（soft/hard interrupt + 可选 bridge）
3. **sleepy 序列**（keyframes）
4. **idle 系统**（无交互下的轻量循环：呼吸/微扫视/偶发眨眼）
5. **overlay**（imprint / happy 或 tsundere 的特殊层级验证）

---
