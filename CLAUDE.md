# Listening Trainer 项目

英语听力填空练习 SPA。用户上传英文文本 → CoreNLP 自动分句挖空 → 校对后生成 TTS → 逐句填空练习 → 回顾模式（原文+答案双栏+音频同步高亮）。

**GitHub**: https://github.com/wp1461772181-glitch/listening-trainer
**Vercel**: https://listening-trainer-xi.vercel.app（已弃用，Vercel→ECS 海外网络超时）
**ECS**: https://listening-trainer.cyou
**域名**: listening-trainer.cyou（HTTPS 已启用，证书到期 2026-08-27）
**本地路径**: D:\listening-trainer

---

## 当前状态

- **在线版本**: java 分支，前端+后端均部署在 ECS（Nginx + Docker）
- **前端部署方式**: `npm run build` → SFTP 上传到 `/var/www/html/listening-trainer/`（脚本: `upload_frontend.cjs`）
- **Vercel 已弃用**: Vercel 海外服务器→杭州 ECS 网络超时，API 代理不可用
- **域名**: https://listening-trainer.cyou（HTTPS 已启用，证书到期 2026-08-27）

---

## 智能挖空算法 (2026-05-30 上线, 2026-05-31 DB化)

### 三级评分体系（已迁移到 MySQL）
词库从硬编码迁移到 `word_bank_entry` 表，由 `WordBankService.java` 管理内存缓存，`WordBank.java` 改为薄代理。
启动时自动从默认词库种子初始化（首次部署），后续通过管理后台增删改。
管理页面: `/word-bank`

1. **黑名单** (score=0 → 绝不挖空): 泛义动词/代词/限定词/介词/连词/常见副词/形容词/缩写/语气词
2. **核心词库** (score=100+ → 优先挖空): 雅思听力高频答案词（地点/时间/数字/生活/校园/旅行/态度）
3. **默认POS评分** (score=5-25): 专有名词=20 > 普通名词=15 > 形容词=10 > 副词=7 > 动词=5

**加分项**: 词长≥6 (+3), 前缀 un/in/dis (+2), 后缀 ful/less/tion (+2)

**选择策略**: 贪心选择，两空之间至少间隔3个词，按分数排序

### 前端挖空渲染修复 (2026-05-30)
**Bug**: API 返回的 blanks 按分数排序而非 position 排序，ClozeRenderer 按接收顺序渲染导致文本偏移/重复
**修复**: `ClozeRenderer.tsx` 中先按 `position` 排序再渲染，用 `origIdx` 保持与 results/answers/inputs 的正确映射

---

## 架构 (java 分支)

### 前端: React 18 + TypeScript + Vite + TailwindCSS v4
- 部署: Vercel 静态站
- `.env.production` — `VITE_API_URL=` 空值，走相对路径
- `vite.config.ts` — proxy `/api/*` 和 `/audio/*` → localhost:8080

### 后端: Spring Boot 3.3 + MyBatis-Plus 3.5.7 + JWT
- 部署: 阿里云 ECS Docker
- `schema.sql` 自动建表（H2 dev / MySQL prod）
- Stanford CoreNLP 4.5.7 分句+词性标注（名词NN*、动词VB*挖空）

### 数据库: MySQL 8.0 (ECS Docker)

---

## ECS 服务器 (Docker 部署)

**服务器**: 121.40.47.186 (阿里云 ECS 杭州, 4核8G)
**SSH**: root@121.40.47.186, 密码 `Wp1461772181.`（Node.js ssh2 连接）
**域名**: listening-trainer.cyou → 121.40.47.186（A 记录）

**Nginx** (80端口):
- 配置: `/etc/nginx/sites-enabled/default`
- 前端: `/var/www/html/listening-trainer/`（来自 java 分支 `npm run build`）
- 代理: `/api/*` → `localhost:8080`（Spring Boot 后端）
- HTTPS: certbot 已安装，待 DNS 生效后签发
- CORS 白名单: `http://localhost:*`, `http://121.40.47.186:*`, `https://listening-trainer-xi.vercel.app`

**容器**:
- `listening-trainer` — Spring Boot 后端
  - 环境变量: `SPRING_PROFILES_ACTIVE=mysql`, `APP_CORS_ORIGINS=...`
  - 网络: `--network app-network`, 端口: `-p 8080:8080`
  - 音频文件: `/root/listening-trainer/audio-data/` → volume mount 到 `/app/public/audio/lessons`
- `mysql` — MySQL 8.0
  - `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=listening_trainer`

**部署脚本**: `deploy_fix.cjs` — SSH 上传 Java 源码 → Docker build → 重启容器
**前端部署**: `upload_frontend.cjs` — Vite build → SFTP 到 `/var/www/html/listening-trainer/`

⚠️ MySQL 通过 `app-network` 通信，jdbc 地址用 `mysql:3306` 不是 localhost。
⚠️ Docker build 不要加 `--no-cache`，mirror.iscas.ac.cn 拉取 JRE 基础层会 504 超时。

---

## Vercel 部署（已弃用）

~~Vercel→ECS 海外网络超时，API 代理不可用。项目已迁移到全 ECS 部署。~~

- 旧配置: Scope `alan-yeager-s-projects`，从 **master** 分支部署
- `vercel.json` 的 `/api/(.*)` rewrite 指向 `http://121.40.47.186:8080`（已失效）

---

## 数据库表（MySQL）

### 旧表（保留兼容）
```sql
users (id, email, password)
user_progress (id, user_id, lesson_id, score, date)
user_progress_summary (id, user_id, lesson_id, latest_score, best_score, total_attempts, last_date)
practice_details (id, progress_id, user_id, lesson_id, keywords, reconstruction, diff_json, listen_count, score, created_at)
```

### 新表（java 分支新增）
```sql
lesson (id, user_id, title, difficulty, hint, status, created_at, updated_at)
  -- status: drafting / generating / ready / failed
lesson_sentence (id, lesson_id, sentence_index, text, audio_path, voice, blanks_json, created_at)
  -- blanks_json: [{word, position, length}] 词性标注挖空
practice_record (id, lesson_id, user_id, score, listen_count, completed_at)
practice_answer (id, record_id, sentence_id, sentence_text, user_answer, blanks_json)
  -- sentence_text 快照保证历史记录不被修改
word_bank_entry (id, word, category, pos_tag, base_score, notes, created_at, updated_at)
  -- category: blacklist / core / pos_default
```

DDL 在 `backend/src/main/resources/schema.sql`

---

## API 接口

### 认证
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 无 | 注册 |
| POST | /api/auth/login | 无 | 登录 |
| GET | /api/auth/me | JWT | 当前用户 |

### 课程管理
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/lessons | JWT | 创建课程（文本→分句→挖空→drafting） |
| PUT | /api/lessons/{id}/sentences | JWT | 更新句子（用户校对编辑） |
| POST | /api/lessons/{id}/generate | JWT | 生成 TTS 音频（drafting→ready） |
| GET | /api/lessons | JWT | 课程列表 |
| GET | /api/lessons/{id} | JWT | 课程详情+句子 |
| DELETE | /api/lessons/{id} | JWT | 删除课程（含音频文件） |

### 练习
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/lessons/{lessonId}/practice?sentenceIdx=N | JWT | 获取单句练习信息 |
| POST | /api/lessons/{lessonId}/practice/submit | JWT | 提交单句答案 |
| POST | /api/lessons/{lessonId}/practice/complete | JWT | 完成练习，保存所有答案 |

### 回顾/历史
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/progress | JWT | 用户进度汇总 |
| GET | /api/progress/history | JWT | 全部练习历史 |
| GET | /api/progress/{lessonId}/history | JWT | 指定课程历史 |
| GET | /api/progress/detail/{progressId} | JWT | 练习详情（新格式优先，旧格式fallback） |

### 静态文件
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| /audio/lessons/{lessonId}/{idx}.mp3 | 预生成的句子音频 |

### 词库管理 (2026-05-31)
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/word-bank | JWT | 词库列表（?category=&search=&offset=&limit=） |
| GET | /api/word-bank/stats | JWT | 各分类数量统计 |
| POST | /api/word-bank | JWT | 新增词条 |
| PUT | /api/word-bank/{id} | JWT | 编辑词条 |
| DELETE | /api/word-bank/{id} | JWT | 删除词条 |
| POST | /api/word-bank/batch-delete | JWT | 批量删除 |
| POST | /api/word-bank/refresh | JWT | 刷新内存缓存 |
| GET | /api/word-bank/score?word=&pos= | JWT | 试算单词分数 |

---

## 前端关键文件 (java 分支)

| 文件 | 用途 |
|------|------|
| `src/types/index.ts` | 类型：Lesson, LessonSentence, ClozeBlank, ReviewDetail, LessonStatus |
| `src/lib/api.ts` | REST API 客户端（课程/练习/回顾函数） |
| `src/lib/router.tsx` | 路由：/lessons, /lessons/new, /player/:id, /history/:id/review |
| `src/routes/PlayerPage.tsx` | 逐句填空练习页（音频→填空→Next→循环） |
| `src/routes/LessonsPage.tsx` | 课程列表（状态徽章+操作按钮） |
| `src/routes/LessonCreatePage.tsx` | 上传文本→校对句子→生成音频 |
| `src/routes/ReviewPage.tsx` | 回顾页（左右分栏：原文+答案+音频同步高亮） |
| `src/routes/HomePage.tsx` | 首页（统计+课程分类+创建入口） |
| `src/routes/WordBankPage.tsx` | 词库管理页（统计/搜索/筛选/CRUD/批量删除） |
| `src/routes/HistoryPage.tsx` | 练习历史总览 |
| `src/components/ClozeRenderer.tsx` | 挖空渲染（输入框或结果展示） |
| `src/components/SentenceEditor.tsx` | 句子校对（编辑/合并/删除） |
| `src/components/StatusBadge.tsx` | 课程状态徽章（drafting/generating/ready/failed） |
| `src/components/OriginalTextPanel.tsx` | 回顾左侧原文面板 |
| `src/components/AnswerPanel.tsx` | 回顾右侧答案面板（错误标红） |
| `src/components/HistoryPanel.tsx` | 练习历史（含后端课程） |
| `src/context/AuthContext.tsx` | JWT token 管理 |
| `src/context/ProgressContext.tsx` | 进度 REST API |

---

## 后端关键文件 (java 分支)

| 文件 | 用途 |
|------|------|
| `config/WebConfig.java` | 静态音频文件服务 `/audio/**` |
| `config/SecurityConfig.java` | permitAll: /api/auth/**, /api/lessons/**, /audio/**, /h2-console/** |
| `controller/LessonController.java` | 课程 CRUD + TTS 生成 |
| `controller/PracticeController.java` | 逐句练习 API |
| `controller/ProgressController.java` | 回顾详情（新格式优先+旧格式fallback） |
| `controller/AuthController.java` | 注册/登录/JWT |
| `service/LessonService.java` | 上传分句→校对→生成百度TTS音频 |
| `service/PracticeService.java` | 练习逻辑+答案评分+回顾数据 |
| `service/SentenceSplitter.java` | Stanford CoreNLP 分句+词性标注+智能挖空评分 |
| `service/WordBank.java` | 薄代理，委托 WordBankService 评分 |
| `service/WordBankService.java` | 词库管理：DB↔内存缓存、CRUD、种子初始化 |
| `controller/WordBankController.java` | /api/word-bank CRUD + 统计 + 刷新 |
| `service/ProgressService.java` | 旧进度逻辑+回顾代理 |
| `entity/Lesson.java` | 课程实体 |
| `entity/LessonSentence.java` | 句子实体 |
| `entity/PracticeRecord.java` | 练习记录实体 |
| `entity/PracticeAnswer.java` | 答案实体 |
| `dto/*.java` | 8 个 DTO（Upload/Edit/Response/Practice/Review） |
| `mapper/*.java` | MyBatis-Plus BaseMapper 接口 |

---

## 练习流程

1. 用户上传英文文本 → 后端 CoreNLP 分句 → WordBank 三级评分智能挖空（名词优先，黑名单过滤常见词）
2. 用户校对句子（编辑/合并/删除/调整挖空）→ 确认
3. 逐句调用百度 TTS 生成 MP3（每句独立文件）→ 状态变为 ready
4. 练习：逐句播放音频 → 填空 → 检查 → Next → 循环
5. 完成练习 → 保存所有答案 → 计算总分 → 更新 UserProgressSummary
6. 回顾：左右双栏，左原文右答案，点击任意句子播放音频+高亮

---

## 已知问题

- Google TTS 国内被墙，已用百度 TTS
- GitHub push 需代理（v2rayN HTTP 10808）
- Vercel 海外服务器→杭州 ECS 网络超时，API 代理不可用（已弃用 Vercel）
- 域名 listening-trainer.cyou HTTPS 已启用，证书到期 2026-08-27（www 子域名因阿里云 WAF 拦截放弃）
- 旧 practice_details 无数据（新练习会生成）
- 旧版 Dictogloss 代码（Player.tsx 等）已删除，历史记录的 `practice_details` 通过 fallback 保持兼容

## 开发日志

### 2026-05-31
- **词库管理后台上线**: WordBank 词库从硬编码迁移到 MySQL `word_bank_entry` 表，`WordBankService` 管理内存缓存
- **新增 API**: `/api/word-bank` CRUD + stats + refresh + score 试算
- **前端**: `/word-bank` 管理页面（统计卡片/搜索/分类筛选/CRUD/批量删除），header 导航入口
- `WordBank.java` 改为薄代理委托 `WordBankService.scoreWord()`，SentenceSplitter 调用不变
- 启动自动种子初始化（首次部署从默认词库导入）

### 2026-05-30
- **智能挖空算法上线**: WordBank 三级评分体系（黑名单/核心词/POS评分），替代原先"所有实词都挖空"的朴素方案
- **ClozeRenderer 渲染修复**: blanks 按 position 排序后再渲染，修复 API 返回顺序导致的文本重复/空白错位问题
- **时区修复**: `LocalDateTime` → `Instant`，前端显示时间正确
- **部署方式确认**: 前端 Vite build → SFTP 上传，后端 SSH 上传源码 → Docker build → 重启容器
