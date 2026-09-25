/**
 * dsh-docs
 * 让 DeepSeek Harness 以「技术文档工程师」角色工作。
 *
 * 这是「高级开发工程师」套件中的独立文档插件。与 dsh-senior-developer（开发本体）
 * 配合使用时，本插件补齐「交付代码的同时产出匹配技术文档」的能力。
 * 不需要时直接卸载本插件即可，无需改任何配置文件。
 *
 * 分发为 bundle：cordis.patch.yml 插入本行。可通过该行 config 控制：
 *   text     — 自定义角色文本（不填则用内置「技术文档工程师」默认角色）
 *   name     — section 名（默认 dsh-docs:docs）
 *   order    — 排序（默认 61；排在开发核心段 50 之后）
 *   complete — true 时本段成为完整 system prompt，抑制其它段（慎用）
 *
 * systemPrompt 服务由 @deepseek-ai/dsh-base 提供，本插件无运行时依赖。
 * @module dsh-docs
 */

/** Cordis 插件名 */
export const name = 'docs'

/** 依赖的系统提示词注册表 */
export const inject = ['systemPrompt']

/** 默认排序值（排在开发核心段 50 之后） */
const DEFAULT_ORDER = 61

/** 默认 section 名 */
const DEFAULT_NAME = 'dsh-docs:docs'

/** 插件标签（用于日志） */
const LABEL = 'docs'

/**
 * 去重注册表：按挂载上下文(ctx) 记录已注册的 section 名。
 */
const REGISTRY = new WeakMap()

/* ===================== 角色文本 ===================== */

/**
 * 文档角色：技术文档工程师。始终注入（除非卸载插件）。
 */
const DOCS_ROLE = `# 角色：技术文档工程师（Docs）

你是一名运行在 DeepSeek Harness（dsh）中的「技术文档工程师」，负责在交付代码的同时产出与其匹配的技术文档，让成果可被他人接手与维护。你交付的不是一个能跑就完事的黑盒，而是一份让人能读懂、能复现、能接手的交付物。

## 产出规范
- 文档与代码同步更新，避免「代码改了文档没动」。
- 不写废话、不重复代码本身；只写「为什么、怎么用、边界在哪」。
- 代码注释只在关键逻辑、非显而易见处；示例可运行、可复制。

## 文档类型与模板

### 1. README（任何可交付项目都必须有）
\`\`\`
# 项目名
一句话定位。

## 功能
- 要点 1
- 要点 2

## 快速开始
\`\`\`bash
# 安装
npm i
# 启动
npm run dev
\`\`\`

## 使用
<最小可运行示例 + 访问方式>

## 配置
<环境变量 / 配置文件说明表>

## 构建 / 测试
npm run build / npm test

## 已知限制
<未覆盖 / 已知问题>

## 许可证
\`\`\`

### 2. API 文档（每个端点 / 函数）
- 用途：一句话。
- 请求：方法 + 路径 / 函数签名；参数表（名称 / 类型 / 必填 / 默认 / 说明）。
- 响应：成功结构（字段 / 类型 / 含义）+ 状态码。
- 错误码：每种错误码含义与触发条件。
- 示例：请求 + 响应的可复制片段。

### 3. 变更日志（Keep a Changelog 风格）
\`\`\`
# Changelog
## [Unreleased]
## [x.y.z] - YYYY-MM-DD
### Added
- 新功能
### Fixed
- 修复项
### Changed
- 变更项
### Removed
- 移除项
\`\`\`

### 4. 架构决策记录（ADR，重大选型时写）
\`\`\`
# ADR-编号：决策标题
## 状态：提议 / 已采纳 / 已废弃
## 背景：为什么需要这个决策
## 决策：我们选了什么
## 后果：正向 / 负向影响与权衡
\`\`\`

## 时机
- 完成一个可交付里程碑时，附上对应文档；脚手架 / 库类项目必须有 README 与基础 API 说明。
- 用户要求文档、或判断他人接手会卡住时，主动补文档。`

/* ===================== 注册逻辑 ===================== */

/**
 * 注册角色段落到挂载上下文的 scope（带去重）。
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {object} [config] - { text?, name?, order?, complete? }
 */
export function apply(ctx, config) {
  const cfg = config && typeof config === 'object' ? config : {}

  if (!ctx.systemPrompt || typeof ctx.systemPrompt.section !== 'function') {
    ctx.logger?.error?.(
      LABEL + ': 未检测到可用的 systemPrompt.section 服务（需 @deepseek-ai/dsh-base）。' +
      '角色段落未注入，请检查 dsh 版本或插件依赖。'
    )
    return
  }

  const sectionName = cfg.name || DEFAULT_NAME

  let registry = REGISTRY.get(ctx)
  if (!registry) { registry = new Set(); REGISTRY.set(ctx, registry) }
  if (registry.has(sectionName)) {
    ctx.logger?.warn?.(LABEL + `: 段 "${sectionName}" 已在本上下文注册，跳过重复挂载（避免重复段落）。`)
    return
  }
  registry.add(sectionName)

  const rawText = typeof cfg.text === 'string' ? cfg.text.trim() : ''
  const text = rawText || DOCS_ROLE
  const order = Number.isFinite(cfg.order) ? cfg.order : DEFAULT_ORDER
  const complete = cfg.complete === true

  if (cfg.complete !== undefined && cfg.complete !== true && cfg.complete !== false) {
    ctx.logger?.warn?.(
      LABEL + ': `complete` 仅接受布尔 true；收到 ' +
      JSON.stringify(cfg.complete) + '，已忽略（本段不会成为完整 system prompt）。'
    )
  }

  ctx.effect(() => {
    const dispose = ctx.systemPrompt.section({
      name: sectionName,
      order,
      text,
      ...(complete ? { complete: true } : {}),
    })
    return () => {
      registry.delete(sectionName)
      if (typeof dispose === 'function') dispose()
      else if (dispose && typeof dispose.dispose === 'function') dispose.dispose()
    }
  }, sectionName)
}
