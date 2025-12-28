const OpenAI = require("openai");
require("dotenv").config();

class AnomalyDetector {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    // 可通过环境变量覆盖模型（默认选择更适合成本/速度的模型）
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    this.alertThresholds = {
      temperature: 80, // 温度阈值 (°C)
      cpuUsage: 90, // CPU使用率阈值 (%)
      memoryUsage: 95 // 内存使用率阈值 (%)
    };
  }

  /**
   * 分析设备数据，检测异常
   */
  async analyzeDeviceData(deviceData) {
    // 基础规则检测
    const basicAnomalies = this.detectBasicAnomalies(deviceData);

    if (basicAnomalies.length === 0 && deviceData.isOnline) {
      return {
        isAbnormal: false,
        severity: "normal",
        reason: "设备运行正常",
        recommendations: []
      };
    }

    // 没有 OpenAI Key：直接降级为规则结果，保证 demo 可用
    if (!this.openai) {
      return this.buildBasicResponse(basicAnomalies);
    }

    // 使用AI进行深度分析
    const aiAnalysis = await this.performAIAnalysis(deviceData, basicAnomalies);

    return aiAnalysis;
  }

  /**
   * 基础规则检测
   */
  detectBasicAnomalies(data) {
    const anomalies = [];
    const temp = data.temperature / 100;
    const cpu = data.cpuUsage / 100;
    const mem = data.memoryUsage / 100;

    if (!data.isOnline) {
      anomalies.push({
        type: "offline",
        message: "设备离线",
        severity: "critical"
      });
    }

    if (temp > this.alertThresholds.temperature) {
      anomalies.push({
        type: "high_temperature",
        message: `温度过高: ${temp.toFixed(1)}°C`,
        severity: temp > 90 ? "critical" : "warning"
      });
    }

    if (cpu > this.alertThresholds.cpuUsage) {
      anomalies.push({
        type: "high_cpu",
        message: `CPU使用率过高: ${cpu.toFixed(1)}%`,
        severity: cpu > 95 ? "critical" : "warning"
      });
    }

    if (mem > this.alertThresholds.memoryUsage) {
      anomalies.push({
        type: "high_memory",
        message: `内存使用率过高: ${mem.toFixed(1)}%`,
        severity: "warning"
      });
    }

    return anomalies;
  }

  /**
   * AI深度分析
   */
  async performAIAnalysis(deviceData, basicAnomalies) {
    try {
      const prompt = this.buildAnalysisPrompt(deviceData, basicAnomalies);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的设备监控系统AI助手，负责分析设备运行数据，识别潜在问题并提供解决建议。请用简洁专业的语言回答。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const analysis = completion.choices[0].message.content;

      // 解析AI返回的分析结果
      return this.parseAIResponse(analysis, basicAnomalies);
    } catch (error) {
      console.error("AI分析失败:", error.message);
      // 降级到基础检测结果
      return this.buildBasicResponse(basicAnomalies);
    }
  }

  /**
   * 构建AI分析提示词
   */
  buildAnalysisPrompt(data, anomalies) {
    const temp = data.temperature / 100;
    const cpu = data.cpuUsage / 100;
    const mem = data.memoryUsage / 100;

    return `
分析以下设备的运行状态：

设备信息：
- 设备名称: ${data.deviceName}
- 设备ID: ${data.deviceId}
- 设备类型: ${data.deviceType}

当前状态：
- 在线状态: ${data.isOnline ? "在线" : "离线"}
- 温度: ${temp.toFixed(1)}°C
- CPU使用率: ${cpu.toFixed(1)}%
- 内存使用率: ${mem.toFixed(1)}%

检测到的异常：
${anomalies.map((a) => `- ${a.message} (${a.severity})`).join("\n")}

请提供：
1. 异常严重程度评估 (normal/warning/critical)
2. 主要原因分析
3. 具体的处理建议 (最多3条)

请以JSON格式返回：
{
  "severity": "warning|critical",
  "reason": "简短的原因描述",
  "recommendations": ["建议1", "建议2", "建议3"]
}
`;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(response, anomalies) {
    try {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isAbnormal: true,
          severity: parsed.severity || "warning",
          reason: parsed.reason || anomalies[0]?.message || "检测到异常",
          recommendations: parsed.recommendations || [],
          aiAnalysis: response
        };
      }
    } catch (error) {
      console.error("解析AI响应失败:", error.message);
    }

    // 解析失败，使用基础响应
    return this.buildBasicResponse(anomalies);
  }

  /**
   * 构建基础响应
   */
  buildBasicResponse(anomalies) {
    if (anomalies.length === 0) {
      return {
        isAbnormal: false,
        severity: "normal",
        reason: "设备运行正常",
        recommendations: []
      };
    }

    const criticalAnomalies = anomalies.filter((a) => a.severity === "critical");
    const severity = criticalAnomalies.length > 0 ? "critical" : "warning";

    const recommendations = anomalies.map((a) => {
      switch (a.type) {
        case "offline":
          return "检查设备网络连接和电源状态";
        case "high_temperature":
          return "检查散热系统，清理灰尘，确保通风良好";
        case "high_cpu":
          return "检查是否有异常进程占用CPU，考虑优化或扩容";
        case "high_memory":
          return "检查内存泄漏，关闭不必要的程序";
        default:
          return "请检查设备日志以获取更多信息";
      }
    });

    return {
      isAbnormal: true,
      severity,
      reason: anomalies[0].message,
      recommendations: recommendations.slice(0, 3)
    };
  }
}

module.exports = AnomalyDetector;



