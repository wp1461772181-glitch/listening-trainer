---
name: listening-trainer
description: "Academic Listening Trainer - dictation-based English practice app with Supabase auth/db, deployed on Vercel"
metadata: 
  node_type: memory
  type: project
  originSessionId: 89b58de9-4599-4a0a-b5be-3852b9dd7c9c
---

Listening Trainer 项目，React + TypeScript + Vite，部署在 Vercel。

**GitHub**: https://github.com/wp1461772181-glitch/listening-trainer
**Vercel**: https://listening-trainer-xi.vercel.app
**本地路径**: D:\listening-trainer

**功能**: 英语听力听写练习网站，3 个难度等级（Daily Life / Campus Life / Academic Lectures），共 15 课。用户听音频后打字输出，系统对比原文打分。

**架构**:
- 前端: React 18 + TypeScript + Vite + TailwindCSS
- 认证/数据库: Supabase (PostgreSQL + Auth RLS)
- 部署: Vercel (静态站点)

**Supabase 配置**:
- Project URL: `https://suubkuumouudvgcowqvl.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dWJrdXVtb3V1ZHZnY293cXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTkxOTEsImV4cCI6MjA5NTIzNTE5MX0.9IWlzM-m03ABhVAha9q1hqLui1DjYrv-rUJwr16dX2U`
- 数据表: `user_progress` (user_id, lesson_id, score, attempts, best_score, date)，启用了 RLS
- Auth: Email/Password provider 已启用，关闭了邮件确认

**网络问题**: Supabase (supabase.co) 被 GFW 墙。本地开发需要 v2rayN (HTTP proxy 10808) 或类似工具。Vercel 的 API 代理方案（serverless function / edge function / routes）部署均失败——NOT_FOUND，可能是 Vite 预设不支持 api/ 目录。当前生产环境直接引用 Supabase URL，国内用户需代理访问。

**Vercel 环境变量**:
- VITE_SUPABASE_URL: `https://suubkuumouudvgcowqvl.supabase.co`
- VITE_SUPABASE_ANON_KEY: (anon key)

**关键文件**:
- `src/lib/supabase.ts` — Supabase 客户端
- `src/context/AuthContext.tsx` — 认证上下文
- `src/context/ProgressContext.tsx` — 进度数据读写（Supabase 替代了 localStorage）
- `src/components/AuthForm.tsx` — 登录/注册 UI
- `src/components/Layout.tsx` — 含用户邮箱和登出按钮
- `api/supabase.js` — (残留) Vercel Edge Function 代理尝试，未生效
- `vercel.json` — (残留) Vercel 路由配置尝试，未生效

**Why**: 从纯前端 localStorage 升级为多用户云端数据库 + 认证系统。
**How to apply**: 新电脑上 clone 项目后，复制 .env 配置，npm install，npm run dev。需要 v2rayN 代理才能连 Supabase。
