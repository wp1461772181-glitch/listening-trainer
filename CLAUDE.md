---
name: listening-trainer
description: "Academic Listening Trainer - dictation-based English practice app, dual-branch: TS+Supabase (master) and Java+Spring Boot (java)"
metadata: 
  type: project
---

Listening Trainer — 英语听力听写练习网站。3 个难度等级（Daily Life / Campus Life / Academic Lectures），5 阶段 Dictogloss 流程（Prep → Listen1 → Notes → Reconstruct → Result）。

**GitHub**: https://github.com/wp1461772181-glitch/listening-trainer
**Vercel**: https://listening-trainer-xi.vercel.app
**ECS**: http://121.40.47.186:8080
**本地路径**: D:\listening-trainer

---

## 双分支架构

### java 分支（当前主力，在线可用）
- 前端: React 18 + TypeScript + Vite + TailwindCSS v4
- 后端: Spring Boot 3.3 + MyBatis-Plus 3.5.7 + JWT
- 数据库: MySQL 8.0 (ECS Docker)
- 前端部署: Vercel (静态站，实际从 master 分支部署)
- 后端部署: 阿里云 ECS 121.40.47.186:8080 (Docker)
- 工作流: java 分支开发 → merge 到 master → Vercel 自动/手动部署

### master 分支（Vercel 部署源）
- Vercel 从 master 部署，java 完成后 merge 过来

---

## ECS 服务器 (Docker 部署)

**服务器**: 121.40.47.186 (阿里云 ECS 杭州, 2核2G)
**SSH**: root@121.40.47.186, 密码 `Wp1461772181.`（用 Node.js ssh2 库连接）

**容器**:
- `listening-trainer` — Spring Boot 后端 (listening-trainer:latest)
  - 环境变量: `SPRING_PROFILES_ACTIVE=mysql`, `APP_CORS_ORIGINS=...`
  - 网络: `--network app-network`, 端口: `-p 8080:8080`
- `mysql` — MySQL 8.0 (mysql:8.0)
  - `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=listening_trainer`

**部署脚本**:
- `upload_backend.cjs` — SFTP 上传指定文件 + Docker rebuild + run
- `deploy_changes.cjs` — git pull + Docker rebuild + run

**重启命令**:
```bash
docker stop listening-trainer && docker rm listening-trainer
docker run -d --name listening-trainer --network app-network -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=mysql \
  -e APP_CORS_ORIGINS="http://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://listening-trainer-xi.vercel.app,https://*.vercel.app" \
  listening-trainer:latest
```

⚠️ 不要用 `--link` 参数。MySQL 通过 `app-network` 通信，jdbc 地址用 `mysql:3306` 不是 localhost。

---

## Vercel 部署

- Scope: `alan-yeager-s-projects`
- 有时 push 后不会自动部署，需手动: `npx vercel --prod --yes --scope alan-yeager-s-projects`
- Vercel Dashboard 里不要设 `VITE_API_URL` 环境变量

---

## 网络架构

Vercel (HTTPS) → `/api/*` → vercel.json rewrites → ECS (HTTP 8080) → 后端

**关键文件**:
- `.env.production` — `VITE_API_URL=` 空值
- `vercel.json` — `/api/(.*)` → `http://121.40.47.186:8080/api/$1`
- `src/lib/api.ts` — `API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'`

---

## API 接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 无 | 注册 |
| POST | /api/auth/login | 无 | 登录 |
| GET | /api/auth/me | JWT | 当前用户 |
| GET | /api/lessons | 无 | 内置课程列表 |
| GET | /api/progress | JWT | 用户进度汇总 |
| POST | /api/progress | JWT | 保存进度（同时写 user_progress + practice_details） |
| GET | /api/progress/history | JWT | 全部练习历史 |
| GET | /api/progress/{lessonId}/history | JWT | 指定课程历史 |
| GET | /api/progress/detail/{progressId} | JWT | 单次练习详情 |
| GET | /api/custom-lessons | JWT | 自定义课程列表 |
| POST | /api/custom-lessons | JWT | 创建自定义课程 |
| DELETE | /api/custom-lessons/{key} | JWT | 删除自定义课程 |
| GET | /api/tts?text=...&spd=3 | 无 | 百度 TTS 音频代理（后端从 fanyi.baidu.com 获取） |

---

## 数据库表（MySQL, listening_trainer）

```sql
users (id, email, password)
user_progress (id, user_id, lesson_id, score, attempts, best_score, date)
practice_details (id, progress_id, lesson_id, keywords, reconstruction, diff_json, listen_count, score, created_at)
user_progress_summary (VIEW)
custom_lessons (id, user_id, lesson_key, title, difficulty, hint, sentence, voice, created_at)
```

⚠️ practice_details 在部署前的旧记录为空，点击历史详情会显示 "Detail not found"

---

## 前端关键文件

| 文件 | 用途 |
|------|------|
| `src/types/index.ts` | 类型定义：Lesson, Difficulty, View |
| `src/data/lessons.ts` | 18 节内置课程（含 audioPath） |
| `src/components/Player.tsx` | Dictogloss 5 阶段播放器。TTS: `/api/tts`，retry 检查 readyState |
| `src/components/CustomLessonForm.tsx` | 自定义课程 + checkSpacing 空格校验 + 中文标点检测 + checkGrammar |
| `src/components/HistoryPanel.tsx` | 练习历史总览 |
| `src/components/LessonHistoryPanel.tsx` | 每节课练习记录 |
| `src/components/HistoryDetailPanel.tsx` | 单次练习详情（4 标签页） |
| `src/lib/api.ts` | REST API 客户端 |
| `src/utils/grammar.ts` | checkGrammar (LanguageTool), checkSpacing (本地空格/中文标点替换), normalizeText |
| `src/utils/customLessons.ts` | 自定义课程 CRUD |
| `src/context/AuthContext.tsx` | JWT token 管理 |
| `src/context/ProgressContext.tsx` | 进度 REST API |

## 后端关键文件

| 文件 | 用途 |
|------|------|
| `controller/AuthController.java` | 注册/登录/JWT |
| `controller/LessonController.java` | 内置课程 |
| `controller/CustomLessonController.java` | 自定义课程 CRUD |
| `controller/ProgressController.java` | 进度保存 + 历史 + 详情 |
| `controller/TtsController.java` | 百度 TTS 代理 `/api/tts` |
| `service/ProgressService.java` | 进度业务（saveProgress 双表写入） |
| `config/SecurityConfig.java` | permitAll: /api/auth/**, /api/lessons/**, /api/tts/**, /h2-console/** |
| `config/CorsConfig.java` | CORS 读 `app.cors.origins` |

## TTS 方案

**百度翻译 TTS**（后端代理）：
- URL: `https://fanyi.baidu.com/gettts?lan=en&text=...&spd=3`
- 免费，无需 API Key，英文可用
- Google TTS 在国内被墙，不能用
- 后端 TtsController 用 HttpURLConnection 代理请求，返回 audio/mpeg

## 文本校验

CustomLessonForm 输入时自动检测：
- 中文标点符号（，。；：？！""''（））→ 替换为英文标点
- 首尾多余空格
- 多余空格/换行
- 标点符号前后空格异常
- 首字母大写
- 检测到问题显示蓝色提示框 + 修复预览 + "Apply Fix" 一键应用

## 已知问题

- Google TTS 国内被墙，已切百度 TTS
- GitHub push 需代理（v2rayN HTTP 10808）
- Vercel 有时不自动部署
- 旧 practice_details 无数据（新练习会生成）
