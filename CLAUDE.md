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
- 前端部署: Vercel (静态站)
- 后端部署: 阿里云 ECS 121.40.47.186:8080 (Docker)

### main 分支（旧版，Supabase 被墙）
- Supabase 认证 + PostgreSQL，国内用户无法访问

---

## ECS 服务器 (Docker 部署)

**服务器**: 121.40.47.186 (阿里云 ECS 杭州, 2核2G)
**SSH**: `ssh root@121.40.47.186`, 密码 `Wp1461772181.`

**容器**:
- `listening-trainer` — Spring Boot 后端 (listening-trainer:latest)
  - 环境变量: `SPRING_PROFILES_ACTIVE=mysql`, `APP_CORS_ORIGINS=http://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://listening-trainer-xi.vercel.app,https://*.vercel.app`
  - 网络: `--network app-network`, 端口: `-p 8080:8080`
- `mysql` — MySQL 8.0 (mysql:8.0)
  - 环境变量: `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=listening_trainer`
  - 网络: `app-network`

**重启命令**:
```bash
docker stop listening-trainer && docker rm listening-trainer
docker run -d --name listening-trainer --network app-network -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=mysql \
  -e APP_CORS_ORIGINS="http://localhost:*,http://121.40.47.186,http://121.40.47.186:*,https://listening-trainer-xi.vercel.app,https://*.vercel.app" \
  listening-trainer:latest
```

⚠️ **不要用 `--link` 参数**，它只支持默认 bridge 网络，MySQL 在 `app-network` 上。

---

## Vercel 部署

- Scope: `alan-yeager-s-projects`
- GitHub 连动: 推 `java` 分支即可自动部署
- CLI 手动部署: `npx vercel --prod --yes --scope alan-yeager-s-projects --token <token>`
- ⚠️ Vercel Dashboard 里 **不要** 设 `VITE_API_URL` 环境变量，它会覆盖 `.env.production` 的空值

---

## Mixed Content 解决方案

Vercel (HTTPS) → 前端相对路径 `/api/*` → vercel.json rewrites 代理 → ECS (HTTP) → 后端 CORS 白名单含 Vercel 域名

**关键文件**:
- `.env.production` — `VITE_API_URL=` 空值，使前端用相对路径
- `vercel.json` — `/api/(.*)` → `http://121.40.47.186:8080/api/$1`
- `backend/Dockerfile` — `APP_CORS_ORIGINS` 含 Vercel HTTPS 域名
- `src/lib/api.ts` — `API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'`

---

## 本地开发

前端: `npm run dev`（端口 5173）
后端: `cd backend && mvn spring-boot:run`（需 JDK 17+，路径 `C:\Program Files\Java\JDK21`）

**Maven**: 系统未安装 mvn，可通过 wrapper 运行或直接用 `C:\Users\Administrator\.m2\wrapper\dists\apache-maven-3.9.6-bin\79744e88\apache-maven-3.9.6\bin\mvn`

---

## 关键文件

- `src/lib/api.ts` — 前端 API 客户端（fetch + JWT）
- `src/context/AuthContext.tsx` — JWT token 存 localStorage
- `src/context/ProgressContext.tsx` — REST API 替代 Supabase
- `backend/src/main/java/com/listeningtrainer/config/CorsConfig.java` — CORS 配置，读 `app.cors.origins`
- `backend/src/main/java/com/listeningtrainer/config/SecurityConfig.java` — 放通 /api/auth/** 和 /api/lessons/**
- `backend/src/main/resources/application.properties` — 默认 h2 profile
- `backend/Dockerfile` — 多阶段构建，render/mysql profile
