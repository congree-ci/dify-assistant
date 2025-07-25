"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Info, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfigValidatorProps {
  apiKey: string
}

export function ConfigValidator({ apiKey }: ConfigValidatorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message: string
    details?: string
  } | null>(null)

  const validateApiKeyFormat = (key: string) => {
    if (!key) return { valid: false, message: "API Key 不能为空" }
    if (key.length < 10) return { valid: false, message: "API Key 长度太短" }
    if (!key.startsWith("app-") && !key.includes("-")) {
      return { valid: false, message: "API Key 格式可能不正确，通常以 'app-' 开头或包含连字符" }
    }
    return { valid: true, message: "API Key 格式看起来正确" }
  }

  const validateConfig = async () => {
    if (!apiKey) {
      setValidationResult({
        isValid: false,
        message: "请填写 API Key",
      })
      return
    }

    // 先验证格式
    const formatCheck = validateApiKeyFormat(apiKey)
    if (!formatCheck.valid) {
      setValidationResult({
        isValid: false,
        message: formatCheck.message,
        details: "请检查您的 API Key 是否从 Dify 控制台正确复制",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Hello",
          apiKey,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult({
          isValid: true,
          message: "API Key 验证成功！",
          details: "连接正常，可以开始使用了",
        })
      } else {
        let errorMessage = "API Key 验证失败"
        let details = ""

        if (response.status === 401) {
          errorMessage = "API Key 无效"
          details = "请检查：\n• API Key 是否正确复制\n• API Key 是否已过期\n• 是否有访问权限"
        } else if (response.status === 404) {
          errorMessage = "API 端点未找到"
          details = "可能是 Dify 服务配置问题，请联系管理员"
        } else if (response.status === 403) {
          errorMessage = "权限不足"
          details = "API Key 可能没有足够的权限访问此应用"
        }

        setValidationResult({
          isValid: false,
          message: errorMessage,
          details: details || data.error,
        })
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "网络连接错误",
        details: "请检查网络连接或稍后重试",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* API Key 格式提示 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>API Key 格式说明：</strong>
          <br />• 通常以 "app-" 开头，如：app-xxxxxxxxxx
          <br />• 长度通常为 20-50 个字符
          <br />• 可在 Dify 控制台的应用设置中找到
        </AlertDescription>
      </Alert>

      <Button
        onClick={validateConfig}
        disabled={isValidating || !apiKey}
        className="w-full bg-transparent"
        variant="outline"
      >
        {isValidating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            验证中...
          </>
        ) : (
          "验证 API Key"
        )}
      </Button>

      {validationResult && (
        <Card
          className={`border ${validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              {validationResult.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${validationResult.isValid ? "text-green-700" : "text-red-700"}`}>
                  {validationResult.message}
                </p>
                {validationResult.details && (
                  <p className={`text-xs mt-1 ${validationResult.isValid ? "text-green-600" : "text-red-600"}`}>
                    {validationResult.details}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 故障排除提示 */}
      {validationResult && !validationResult.isValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>故障排除：</strong>
            <br />
            1. 确认从 Dify 控制台复制了正确的 API Key
            <br />
            2. 检查 API Key 是否有访问权限
            <br />
            3. 确认 Dify 应用已正确配置和发布
            <br />
            4. 如果是私有部署，请联系管理员确认 API 端点
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
