# 挖空算法优化 + 音频逼真化设计

**日期**: 2026-06-10  
**分支**: Claude  
**目标**: 优化挖空合理性 + 难度分级 + TTS 多说话人/自然节奏/情感表达

---

## 1. 挖空算法优化

### 1.1 问题诊断

**挖词合理性问题**:
- 专有名词 (NNP/NNPS) 如 "London", "John" 不该挖 — 当前 SKIP_WORDS 只包含部分人名，CoreNLP 标注的 NNP 没有统一跳过
- 数字格式遗漏 — SKIP_WORDS 只有英文单词（one, two），没有处理 "$20", "2024", "3.5" 等
- 带撇号的词如 "student's" 处理不当

**缺乏难度分级**:
- 当前 difficulty 字段只用于展示，不影响挖空策略
- 所有课程用相同的 tier 阈值和上限

### 1.2 解决方案

#### A. 专有名词统一跳过
```java
// SentenceSplitter.generateBlanks() 中
if (pos.startsWith("NNP") || pos.startsWith("NNPS")) {
    sentWordIdx++;
    continue; // 跳过所有专有名词
}
```

#### B. 数字/符号格式统一过滤
```java
// 在 wordBank.scoreWord() 开头扩展
// 过滤: 纯数字、带$€£、带%、带年份(4位数字)、小数
if (word.matches(".*\\d.*")) return 0; // 包含任何数字的都跳过
```

#### C. 难度分级策略

| 难度 | 每句上限 | 全局上限 | Tier 策略 | 目标 |
|------|---------|---------|----------|------|
| easy | 1 | sentences/3 | 只挖 Tier 0-1（核心词+名词） | 练习基本听辨 |
| medium | 2 | sentences/2 | 当前策略 Tier 0-3 | 平衡练习 |
| hard | 3 | sentences*2/3 | 包含 Tier 0-4 + 降低分数阈值 | 高密度练习 |

实现：`SentenceSplitter.generateBlanks(text, offset, mode, difficulty)` 传入难度参数

#### D. 挖词合理性增强
- Tier 1 名词增加排除：复合词第二部分（如 "roommate" 的 "mate"）不单独挖
- 动词短语不拆分：如 "look forward to" 只挖 "forward"，不挖 "look"
- 固定搭配保护：如 "take care of" 整体作为考点

### 1.3 测试计划

**单元测试**:
- `testBlankGeneration()`: 验证 NNP 不挖、数字不挖
- `testDifficultyEasy()`: easy 模式只挖 Tier 0-1
- `testDifficultyHard()`: hard 模式挖更多词
- `testDeduplication()`: 同一词全局只出现一次
- `testAdaptiveCap()`: 验证全局上限公式

**A/B 对比**:
- 用同一段 IELTS 对话文本
- 旧算法 vs 新算法分别生成
- 输出对比报告：挖了哪些词、位置、难度分布

---

## 2. TTS 音频逼真化

### 2.1 当前状态

- edge-tts microservice (tts_server.py)
- 2 个声音: en-US-GuyNeural, en-US-JennyNeural
- 纯文本输入，无 SSML 控制

### 2.2 edge-tts SSML 能力

edge-tts 支持完整 SSML 1.1：
- `<voice name="...">` — 多说话人
- `<break time="500ms"/>` — 停顿
- `<prosody rate="slow" pitch="+10%">` — 语速/音调
- `<emphasis level="strong">` — 重音
- `<mstts:express-as style="cheerful">` — 情感（仅部分声音支持）

支持情感的声音: en-US-JennyNeural, en-US-AriaNeural, en-US-GuyNeural 等 Neural 声音

### 2.3 多说话人方案

**声音池**:
```python
VOICES = {
    "female_young": "en-US-JennyNeural",
    "female_mature": "en-US-AriaNeural", 
    "male_young": "en-US-GuyNeural",
    "male_mature": "en-US-DavisNeural",
    "female_child": "en-US-AnaNeural",
    "male_child": "en-US-AnthonyNeural",
}
```

**角色分配逻辑**:
- 解析 speaker prefix (已实现: "Customer:", "A:", etc.)
- 对话模式: 按 speaker 哈希分配声音，确保同一角色声音一致
- 段落模式: 单一声音（用户选择）

### 2.4 语速/节奏自然化

**SSML 增强规则**:
```xml
<speak version="1.0" xmlns:mstts="...">
  <voice name="en-US-JennyNeural">
    <!-- 句首短暂停顿 -->
    <break time="200ms"/>
    
    <!-- 逗号/分号处停顿 -->
    Hello<break time="300ms"/> how are you<break time="200ms"/> today?
    
    <!-- 感叹句提高音调 -->
    <prosody pitch="+15%" rate="fast">That's amazing!</prosody>
    
    <!-- 问句末尾升调 -->
    <prosody pitch="+10%">What time is it</prosody><break time="100ms"/>?
  </voice>
</speak>
```

**自动规则**:
- 逗号后: `<break time="300ms"/>`
- 句号后: `<break time="500ms"/>`
- 感叹号: `<prosody pitch="+15%" rate="fast">`
- 问号: 末尾 `<prosody pitch="+10%">` 升调
- 引号内对话: 轻微降低音量 `<prosody volume="-10%">`

### 2.5 情感表达

**情感检测规则**:
```python
def detect_emotion(sentence):
    if "!" in sentence: return "cheerful"
    if "?" in sentence: return "friendly"
    if any(w in sentence.lower() for w in ["sorry", "afraid", "unfortunately"]): return "sad"
    if any(w in sentence.lower() for w in ["angry", "frustrated", "hate"]): return "angry"
    return "general"  # 默认
```

**SSML 情感标签**:
```xml
<mstts:express-as style="cheerful">
  That's wonderful news!
</mstts:express-as>
```

### 2.6 实现方案

**改造 tts_server.py**:
1. 新增 `/api/tts-ssml` 端点，接收 SSML 文本
2. 新增 `/api/tts-voice` 端点，接收 voice name + text
3. 保留旧 `/api/tts` 端点兼容

**后端改造 LessonService.generateAudio()**:
1. 解析 speaker prefix → 分配 voice
2. 构造 SSML（加停顿、情感、重音）
3. 调用新 TTS 端点

### 2.7 测试计划

**单元测试**:
- `testSSMLGeneration()`: 验证标点→停顿标签
- `testEmotionDetection()`: 验证感叹号→cheerful
- `testVoiceAssignment()`: 验证 speaker→voice 一致性

**A/B 对比**:
- 同一段对话用旧 TTS vs 新 TTS
- 输出两个 MP3 文件
- 日志记录：用了哪些声音、停顿位置、情感标签

**人工验证**（用户醒来后）:
- 听新旧音频对比
- 检查多说话人是否自然
- 检查停顿/情感是否合理

---

## 3. 实施顺序

### Phase 1: 挖空算法优化
1. 扩展 SKIP_WORDS + 过滤数字/专有名词
2. 添加 difficulty 参数传递
3. 实现三档难度策略
4. 写单元测试
5. 写 A/B 对比脚本

### Phase 2: TTS 逼真化
1. tts_server.py 添加 SSML 端点
2. 实现 SSML 构造器（标点→停顿、情感检测）
3. 实现多说话人声音池
4. LessonService 改造音频生成
5. 写单元测试
6. 写 A/B 对比脚本

### Phase 3: 集成测试
1. 创建测试课程（easy/medium/hard 各一个）
2. 生成音频，听效果
3. 对比挖空结果
4. 修复问题，迭代

### Phase 4: 提交
1. 所有测试通过
2. 更新 CLAUDE.md
3. git commit
4. 不部署（用户要求先测试满意再说）

---

## 4. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| edge-tts 不支持某些 SSML | 情感表达失败 | 降级到纯 prosody，不用 express-as |
| SSML 构造错误导致 TTS 失败 | 音频生成失败 | 保留纯文本 fallback |
| 难度分级不合理 | easy 太简单，hard 太难 | 写测试用例验证分布，可调整阈值 |
| 多说话人哈希冲突 | 两个角色声音相同 | 用 speaker name 哈希，冲突概率低 |

---

## 5. 成功标准

- [ ] 专有名词 (NNP) 100% 不挖
- [ ] 数字/符号 100% 不挖
- [ ] easy/medium/hard 挖空数量差异 ≥30%
- [ ] 对话模式 ≥2 个不同声音
- [ ] 停顿自然（逗号/句号处有 break）
- [ ] 情感标签生效（感叹句用 cheerful）
- [ ] 单元测试全部通过
- [ ] A/B 对比报告生成
- [ ] 用户醒来后听样本满意

---

**设计审核**: 用户已确认需求，授权自动实施。
