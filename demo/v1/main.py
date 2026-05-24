import os
import json
import asyncio
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

load_dotenv()

app = FastAPI(title="AI Emotion Shield v1")

client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY", ""),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)
MODEL = os.getenv("MODEL_NAME", "gpt-4o")

DOWNSTREAM_PROMPT = """你是一个情绪翻译引擎，保护一线服务者的心理健康。

输入：客户的原始消息（可能包含辱骂、讽刺、威胁）
输出严格JSON（不要输出其他内容）：
{
  "filtered_text": "去除攻击性后的理性版本",
  "core_request": "客户的核心诉求（一句话）",
  "emotion_level": "mild 或 angry 或 extreme",
  "emotion_score": 1到5的数字(5最严重),
  "risk_flags": ["关键词标签数组"],
  "suggested_reply": "建议服务者如何回应（一句话，专业得体）"
}

原则：
- 不隐瞒信息，只转换表达方式
- 标注情绪等级帮助服务者做心理准备
- 建议回复要专业但不卑微"""

UPSTREAM_PROMPT = """你是一个话术优化引擎，帮助服务者把口语化回复转为专业得体的版本。

输入：服务者的原始回复
输出严格JSON（不要输出其他内容）：
{
  "polished_text": "专业得体的版本",
  "tone": "语气类型（道歉/解释/安抚/告知）",
  "changes": "简述修改了什么"
}

原则：
- 保留服务者的原意和判断
- 不过度卑微，保持平等尊重的语气
- 让回复更清晰、更有条理"""


async def call_llm(system_prompt: str, user_message: str) -> dict:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    raw = response.choices[0].message.content
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
    return json.loads(cleaned)


class ConnectionManager:
    def __init__(self):
        self.customers: list[WebSocket] = []
        self.agents: list[WebSocket] = []

    async def connect_customer(self, ws: WebSocket):
        await ws.accept()
        self.customers.append(ws)

    async def connect_agent(self, ws: WebSocket):
        await ws.accept()
        self.agents.append(ws)

    def disconnect_customer(self, ws: WebSocket):
        self.customers.remove(ws) if ws in self.customers else None

    def disconnect_agent(self, ws: WebSocket):
        self.agents.remove(ws) if ws in self.agents else None

    async def broadcast_to_customers(self, data: dict):
        for ws in self.customers:
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def broadcast_to_agents(self, data: dict):
        for ws in self.agents:
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws/customer")
async def ws_customer(websocket: WebSocket):
    await manager.connect_customer(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg_text = data.get("text", "")
            await manager.broadcast_to_customers(
                {"type": "customer_msg", "text": msg_text}
            )
            await manager.broadcast_to_agents({"type": "analyzing"})
            try:
                result = await call_llm(DOWNSTREAM_PROMPT, msg_text)
                await manager.broadcast_to_agents(
                    {"type": "ai_card", "result": result, "original": msg_text}
                )
            except Exception as e:
                await manager.broadcast_to_agents(
                    {"type": "error", "message": str(e)}
                )
    except WebSocketDisconnect:
        manager.disconnect_customer(websocket)


@app.websocket("/ws/agent")
async def ws_agent(websocket: WebSocket):
    await manager.connect_agent(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "draft":
                text = data.get("text", "")
                await manager.broadcast_to_agents(
                    {"type": "draft", "text": text}
                )
                try:
                    result = await call_llm(UPSTREAM_PROMPT, text)
                    await manager.broadcast_to_agents(
                        {"type": "polished", "result": result, "original": text}
                    )
                except Exception as e:
                    await manager.broadcast_to_agents(
                        {"type": "error", "message": str(e)}
                    )

            elif action == "send":
                text = data.get("text", "")
                await manager.broadcast_to_customers(
                    {"type": "agent_reply", "text": text}
                )
                await manager.broadcast_to_agents(
                    {"type": "sent", "text": text}
                )
    except WebSocketDisconnect:
        manager.disconnect_agent(websocket)


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
