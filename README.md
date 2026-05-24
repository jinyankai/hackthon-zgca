# AI 情绪护盾：双向情绪防火墙

现场启动与操作步骤见 [Demo 启动与操作手册](docs/DEMO_RUNBOOK.md)。

12 小时黑客松 MVP：面向快递、外卖、餐饮客服等一线服务场景，在客户和服务者之间加入一层 AI 双向情绪翻译中间件。

## Demo 重点

- 客户侧：普通聊天界面，支持文字输入、浏览器语音转写、预置脚本兜底。
- 服务者侧：展示 AI 降噪文本、核心诉求、情绪等级、风险标签、原文查看、建议回复、情绪电量。
- 双向闭环：客户消息下行降噪，服务者草稿上行优化，最终由服务者确认后发送。
- 稳定演示：默认 mock fallback，无 OpenAI key 也可以跑完整流程。
- 自动演示：从 `frontend/mocks/dialogueCorpus.json` 的固定多轮语料库随机抽取一组播放，并可回退手动演示。

## 快速启动

后端：

```powershell
python -m pip install -r backend/requirements.txt
npm run dev:backend
```

前端：

```powershell
npm --prefix frontend install
npm run dev:frontend
```

打开：

```text
http://localhost:3000
```

## 可选 LLM 配置

默认使用 mock。需要真实模型时设置：

```powershell
$env:LLM_PROVIDER="openai"
$env:OPENAI_API_KEY="sk-..."
$env:LLM_MODEL="gpt-4o"
```

## 验证

```powershell
npm run check:harness
npm run check:backend
npm run check:frontend
```

## Harness

仓库已包含 agent-ready harness：

- `AGENTS.md`
- `docs/agent-harness/`
- `agents/skills/`
- `evals/smoke_eval.py`
- `.github/workflows/harness.yml`
