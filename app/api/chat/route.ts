import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey } = await request.json()

    if (!message || !apiKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // 尝试不同的 API 端点和格式
    const endpoints = [
      // 标准 Dify Cloud API
      {
        url: "https://api.dify.ai/v1/chat-messages",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: {
          inputs: {},
          query: message,
          response_mode: "blocking",
          conversation_id: "",
          user: "user-" + Date.now(),
        },
      },
      // 备用格式 1
      {
        url: "https://api.dify.ai/v1/completion-messages",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: {
          inputs: {},
          query: message,
          response_mode: "blocking",
          user: "user-" + Date.now(),
        },
      },
      // 备用格式 2 - 使用不同的认证头
      {
        url: "https://api.dify.ai/v1/chat-messages",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: {
          inputs: {},
          query: message,
          response_mode: "blocking",
          conversation_id: "",
          user: "user-" + Date.now(),
        },
      },
    ]

    let lastError = null

    // 尝试不同的端点配置
    for (const config of endpoints) {
      try {
        console.log(`Trying endpoint: ${config.url}`)

        const response = await fetch(config.url, {
          method: "POST",
          headers: config.headers,
          body: JSON.stringify(config.body),
        })

        console.log(`Response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log("Success with endpoint:", config.url)

          return NextResponse.json({
            response: data.answer || data.result || data.text || "收到回复，但格式异常",
            conversationId: data.conversation_id,
            messageId: data.message_id,
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          lastError = {
            status: response.status,
            message: errorData.message || `HTTP ${response.status}`,
            endpoint: config.url,
          }
          console.log(`Failed with endpoint ${config.url}:`, lastError)
        }
      } catch (error) {
        lastError = {
          status: 500,
          message: error instanceof Error ? error.message : "Network error",
          endpoint: config.url,
        }
        console.log(`Error with endpoint ${config.url}:`, error)
      }
    }

    // 如果所有端点都失败了
    if (lastError) {
      if (lastError.status === 401) {
        return NextResponse.json(
          {
            error: "API Key 无效或已过期。请检查：\n1. API Key 格式是否正确\n2. API Key 是否有效\n3. 是否有足够的权限",
          },
          { status: 401 },
        )
      }
      if (lastError.status === 404) {
        return NextResponse.json(
          {
            error: "API 端点未找到。请确认您的 Dify 服务配置正确。",
          },
          { status: 404 },
        )
      }
      if (lastError.status === 403) {
        return NextResponse.json(
          {
            error: "API Key 权限不足。请检查 API Key 的权限设置。",
          },
          { status: 403 },
        )
      }
    }

    return NextResponse.json(
      {
        error: `所有 API 端点都无法连接。最后错误: ${lastError?.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "服务器内部错误，请稍后重试",
      },
      { status: 500 },
    )
  }
}
