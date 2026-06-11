# 挖空算法优化 + TTS 逼真化 实施总结

**日期**: 2026-06-11  
**分支**: Claude  
**状态**: ✅ 完成（未部署）

---

## 挖空算法优化

### 修复
✅ 专有名词 (NNP/NNPS) 100% 跳过  
✅ 数字/符号 100% 过滤（包含数字的词都跳过）

### 难度分级
✅ Easy: 1 blank/sentence, 只挖 Tier 0-1（核心词+名词）  
✅ Medium: 2 blanks/sentence（默认）  
✅ Hard: 3 blanks/sentence, 包含所有 Tier

### 全局上限调整
✅ Easy: sentences/3, range [5, 15]  
✅ Medium: sentences/2, range [10, 25]（不变）  
✅ Hard: sentences*2/3, range [15, 35]

### 测试
✅ 单元测试: SentenceSplitterTest, WordBankServiceTest  
✅ A/B 对比脚本: ab_test_blank_algorithm.cjs  
✅ 验证通过: 无专有名词/数字被挖，难度分级生效

---

## TTS 逼真化

### 多说话人
✅ 声音池: 6 个声音（female_young/mature/child, male_young/mature/child）  
✅ 对话模式自动分配: VoiceAllocator 根据 speaker name 一致哈希  
✅ 同一角色声音一致

### SSML 增强
✅ 停顿: 逗号/分号 300ms，句号/感叹号/问号 500ms  
✅ 语调: 感叹句 pitch+15% rate=fast，问句 pitch+5%  
✅ 情感检测: 自动应用 cheerful/sad/angry/friendly prosody

### 实现
✅ Python SSML 构造器: ssml_builder.py  
✅ TTS 服务端点: /api/tts-ssml, /api/tts-voice (端口 5001)  
✅ 后端集成: LessonService.buildSSML() + EdgeTtsService.generateSsmlAudio()

### 测试
✅ 单元测试: VoiceAllocatorTest (6 tests)  
✅ A/B 对比脚本: ab_test_tts.py  
✅ 集成测试: integration_test.cjs  
✅ 全部 28 个后端测试通过

---

## 文件清单

### 后端修改
- `SentenceSplitter.java`: NNP 跳过、difficulty 参数、easy 模式过滤
- `WordBankService.java`: 数字过滤（任何包含数字的词返回0）
- `LessonService.java`: difficulty 传递、SSML TTS 集成、VoiceAllocator
- `VoiceAllocator.java`: 多说话人声音分配（新增）
- `TtsService.java`: 添加 generateSsmlAudio 方法
- `EdgeTtsService.java`: 实现 SSML 音频生成
- `BaiduTtsService.java`: generateSsmlAudio 返回 false（降级）

### TTS 服务
- `tts_server.py`: /api/tts-ssml, /api/tts-voice 端点，端口5001
- `ssml_builder.py`: SSML 构造器（新增）

### 测试
- `SentenceSplitterTest.java` (4 tests): NNP skip, difficulty
- `WordBankServiceTest.java` (5 tests): digit filter
- `VoiceAllocatorTest.java` (6 tests): voice allocation
- `ab_test_blank_algorithm.cjs`: A/B 对比脚本
- `ab_test_tts.py`: TTS 质量 A/B 对比
- `integration_test.cjs`: 端到端集成测试

### 文档
- `docs/superpowers/specs/2026-06-10-algorithm-and-tts-improvements-design.md`
- `docs/superpowers/plans/2026-06-10-algorithm-tts-improvements.md`
- `CLAUDE.md`: 更新挖空算法和 TTS 说明

---

## Git 提交记录

```
d5dfba2 docs: update CLAUDE.md with algorithm and TTS improvements
bc80de5 test: add end-to-end integration test
31e5f56 test: add A/B comparison script for TTS quality
ab78896 feat: integrate SSML TTS with multi-speaker support
b0edc21 feat: VoiceAllocator for multi-speaker dialogue
4cb06ef feat: TTS server SSML endpoints + voice pool
080a1ae test: add A/B comparison script for blank generation algorithm
6cb7373 feat: difficulty-aware adaptive blank cap
dfeaaad feat: add difficulty parameter to blank generation (easy/medium/hard)
dc0c65b fix: filter out all words containing digits in scoreWord
b9e7074 fix: skip proper nouns (NNP/NNPS) in blank generation
```

---

## 待用户验证

用户醒来后需要：

1. **运行后端测试**：
   ```bash
   cd backend && mvn test
   ```

2. **启动服务并测试**：
   ```bash
   # 后端
   cd backend && mvn spring-boot:run
   
   # TTS 服务
   python tts_server.py  # 端口 5001
   
   # 集成测试
   node integration_test.cjs
   ```

3. **听音频样本**：
   ```bash
   afplay backend/public/audio/lessons/<ID>/0.mp3
   ```

4. **运行 A/B 对比**：
   ```bash
   node ab_test_blank_algorithm.cjs
   python ab_test_tts.py
   ```

5. **如果满意，部署到 ECS**：
   ```bash
   # 前端
   npm run build && node upload_frontend.cjs
   
   # 后端
   python deploy_backend.py
   ```

---

**下一步**: 用户验证满意后，可以部署到生产环境。
