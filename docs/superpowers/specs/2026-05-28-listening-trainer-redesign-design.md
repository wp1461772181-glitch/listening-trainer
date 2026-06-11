# Listening Trainer 听力训练模式重构设计

**日期**: 2026-05-28
**作者**: Claude + 用户协作
**状态**: 已审批

---

## 概述

将现有听写模式（Dictogloss）改造为"逐句填空"模式，并为回顾模式添加"原文+音频同步高亮"功能，实现类似雅思听力软件的交互体验。

### 核心变更

1. **练习模式**：上传多句文本 → 自动切分 + 词性标注挖空 → 用户校对 → 生成音频 → 逐句播放填空
2. **回顾模式**：左右分栏，左侧原文点击播放对应句子音频并高亮，右侧用户答案错误标红

---

## 1. 数据模型

### 1.1 后端表结构

#### `lesson` 表（替代原有 `custom_lessons`）

| 列名 | 类型 | 说明 |
|------|------|------|
| id | Long, auto | 主键 |
| userId | Long | 用户 ID |
| title | String | 课程标题 |
| difficulty | String | daily / campus / academic |
| hint | String | 课程提示/摘要 |
| status | String | drafting / generating / ready / failed |
| createdAt | LocalDateTime | 创建时间 |
| updatedAt | LocalDateTime | 更新时间 |

#### `lesson_sentence` 表

| 列名 | 类型 | 说明 |
|------|------|------|
| id | Long, auto | 主键 |
| lessonId | Long | 关联课程 ID |
| index | int | 句子序号，决定播放顺序 |
| text | String | 原始完整句子 |
| audioPath | String | TTS MP3 路径，如 `/audio/lessons/{lessonId}/{index}.mp3` |
| voice | String | male / female |
| blanksJson | String | 该句挖空信息 JSON: `[{word, position, length}]` |
| createdAt | LocalDateTime | 创建时间 |

#### `practice_record` 表（替代原有 `practice_details` 的练习记录）

| 列名 | 类型 | 说明 |
|------|------|------|
| id | Long, auto | 主键 |
| lessonId | Long | 课程 ID |
| userId | Long | 用户 ID |
| score | int | 总分 |
| listenCount | int | 播放次数 |
| completedAt | LocalDateTime | 完成时间 |

#### `practice_answer` 表

| 列名 | 类型 | 说明 |
|------|------|------|
| id | Long, auto | 主键 |
| recordId | Long | 关联练习记录 ID |
| sentenceId | Long | 关联句子 ID |
| sentenceText | String | 句子原文快照（即使句子被修改仍可展示） |
| userAnswer | String | 用户填写的答案（JSON 数组，如 `["energy", "cell"]`） |
| blanksJson | String | 对错结果 JSON: `[{word, correct, userAnswer}]` |

#### 保留的表

- `user_progress` — 保留，继续存汇总进度
- `user_progress_summary` — 保留

### 1.2 前端类型定义

```typescript
interface Lesson {
  id: number;
  title: string;
  difficulty: 'daily' | 'campus' | 'academic';
  hint: string;
  status: 'drafting' | 'generating' | 'ready' | 'failed';
  sentences: LessonSentence[];
}

interface LessonSentence {
  id: number;
  index: number;
  text: string;
  audioPath: string;
  voice: 'male' | 'female';
  blanks: ClozeBlank[];
}

interface ClozeBlank {
  word: string;
  position: number;
  length: number;
}

interface PracticeRecord {
  id: number;
  lessonId: number;
  score: number;
  listenCount: number;
  completedAt: string;
  answers: PracticeAnswer[];
}

interface PracticeAnswer {
  sentenceId: number;
  sentenceText: string;
  userAnswer: string;
  blanks: { word: string; correct: boolean; userAnswer: string }[];
}
```

---

## 2. 后端 API

### 2.1 课程管理

```
POST   /api/lessons               上传文本，返回切分后的句子列表（状态: drafting）
PUT    /api/lessons/{id}/sentences 用户校对：修改、合并、拆分、删除句子
POST   /api/lessons/{id}/generate  开始生成 TTS，状态变为 generating
GET    /api/lessons                获取课程列表（含 status）
GET    /api/lessons/{id}           获取课程详情（含所有句子和挖空信息）
DELETE /api/lessons/{id}           删除课程
```

#### 课程上传+校对流程

1. `POST /api/lessons` — 接收文本，Stanford CoreNLP 按句号切分，自动识别每句名词/动词生成 `blanksJson`，返回 lesson + sentences
2. 前端展示句子列表供用户编辑
3. `PUT /api/lessons/{id}/sentences` — 保存校对后的句子
4. `POST /api/lessons/{id}/generate` — 逐句调用 TTS 生成 MP3，更新 `audioPath`，状态改为 `ready`

### 2.2 练习

```
GET    /api/lessons/{id}/practice                          开始练习，获取当前句音频和挖空信息
POST   /api/lessons/{id}/practice/{sentenceIdx}/submit     提交当前句答案
POST   /api/lessons/{id}/practice/complete                 完成全部句子，返回总分和记录 ID
```

### 2.3 回顾

```
GET    /api/progress/history                获取练习历史列表
GET    /api/progress/detail/{recordId}      获取详细回顾（原文 + 用户答案 + 对错标记）
```

### 2.4 TTS 生成

复用现有 `tts_server.py`。后端逐句请求，保存 MP3 到 `public/audio/lessons/{lessonId}/{index}.mp3`。TTS 失败则标记课程状态为 `failed`。

---

## 3. 前端组件架构

### 3.1 页面路由

```
/lessons                          课程列表页（新增）
/lessons/new                      上传+校对页（新增）
/player/:lessonId                 练习页（改造现有）
/history                          历史记录页（保留现有）
/history/:recordId/review         回顾页（改造现有 HistoryDetailPage）
```

### 3.2 新/改造组件

#### 上传校对页 `/lessons/new`
- `LessonUploadForm` — 粘贴文本，选择难度和语音
- `SentenceEditor` — 句子列表，每句可编辑、合并、拆分、删除
- `StatusBadge` — 课程状态徽章

#### 练习页 `/player/:lessonId`
- `SentenceProgress` — 顶部进度条：第 3/10 句
- `ClozeRenderer` — 原文渲染，挖空处替换为 `<input>`
- `AudioPlayerBar` — 播放控制：播放当前句、重播、暂停、下一句
- `PracticeSummary` — 完成后的总分展示

#### 回顾页 `/history/:recordId/review`
- `ReviewLayout` — 左右分栏
  - 左侧 `OriginalTextPanel` — 完整原文，点击句子播放该句音频
  - 右侧 `AnswerPanel` — 用户答案，错误标红，点击句子跳转播放

### 3.3 关键交互流程

**练习模式：**
1. 页面加载 → GET 第 1 句信息 → 自动播放音频
2. 音频结束 → 显示挖空 input
3. 填写后点 Next → POST 保存答案 → 播放下一句
4. 最后一句提交 → POST 完成 → 计算总分 → 展示 PracticeSummary

**回顾模式：**
1. 页面加载 → GET 练习记录（含原文 + 答案 + 对错）
2. 点击左侧原文某句 → 播放该句音频，高亮该行
3. 点击右侧答案某句 → 播放该句音频，同时高亮原文和答案对应行
4. 移动端：左右分栏改为上下堆叠

---

## 4. 错误处理与边界情况

| 场景 | 处理方式 |
|------|----------|
| TTS 单句失败 | 重试 3 次，仍失败标记课程 status=failed |
| 前端列表展示失败课程 | 灰显，点击显示"音频生成失败，点击重试" |
| 课程编辑后已有练习记录 | 练习记录存储 sentenceText 快照，不受句子修改影响 |
| 音频加载失败 | 显示"音频加载失败，点击重试" |
| 空句子 | 自动过滤 |
| 单句超过 500 词 | 警告"句子过长，建议拆分" |
| 无句子分隔符 | 提示"未检测到句子分隔符" |
| 移动端回顾页 | 左右分栏改为上下堆叠 |

---

## 5. 技术选型

| 组件 | 选型 | 说明 |
|------|------|------|
| 词性标注 | Stanford CoreNLP | 准确率最高，支持英文词性标注 |
| TTS | 现有 tts_server.py | 复用现有服务 |
| 音频存储 | 本地文件系统 | `/audio/lessons/{lessonId}/{index}.mp3` |
| 句子切分 | 正则 + CoreNLP | 按句号/问号/感叹号切分 |
| 挖空策略 | CoreNLP 词性标注 | 自动识别名词(NN)和动词(VB)，用户可调整 |

---

## 6. 迁移计划

1. 创建新表 `lesson`、`lesson_sentence`、`practice_record`、`practice_answer`
2. 旧表 `custom_lessons` 的数据可选择迁移或丢弃（由于结构差异大，建议保留旧表作为只读存档）
3. 旧表 `practice_details` 的数据迁移到 `practice_record` + `practice_answer`
4. 前端删除/废弃 `CustomLessonForm`、旧版 `Player` 组件
5. 前端路由更新：`/lessons/:difficulty` → `/lessons`
