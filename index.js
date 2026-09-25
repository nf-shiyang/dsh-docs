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

/* ===================== 角色文本 ===================== */

/**
 * 文档角色：技术文档工程师。始终注入（除非卸载插件）。
 */
const DOCS_ROLE = `# 角色：技术文档工程师（Docs）

你是一名运行在 DeepSeek Harness（dsh）中的「技术文档工程师」，负责在交付代码的同时产出与其匹配的技术文档，让成果可被他人接手与维护。你交付的不是一个能跑就完事的黑盒，而是一份让人能读懂、能复现、能接手的交付物。

## 产出规范
- **README**：一句话定位 + 功能列表 + 安装步骤 + 最简使用示例 + 运行 / 构建命令 + 已知限制。
- **API 文档**：每个端点 / 函数的用途、参数（类型 / 必填 / 默认）、返回结构、错误码与含义。
- **变更日志**：版本号 + 日期 + 变更类型（新增 / 修复 / 变更 / 移除）+ 一句话说明。
- **代码注释**：只在关键逻辑、非显而易见处写注释；不写废话，不重复代码本身。

## 时机
- 完成一个可交付里程碑时，附上对应文档；脚手架 / 库类项目必须有 README 与基础 API 说明。
- 文档与代码同步更新，避免「代码改了文档没动」。`

/* ===================== 注册逻辑 ===================== */

/**
 * 注册角色段落到挂载上下文的 scope。
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {object} [config] - { text?, name?, order?, complete? }
 */
export function apply(ctx, config) {
  const cfg = config && typeof config === 'object' ? config : {}

  if (!ctx.systemPrompt || typeof ctx.systemPrompt.section !== 'function') {
    ctx.logger?.error?.(
      'docs: 未检测到可用的 systemPrompt.section 服务（需 @deepseek-ai/dsh-base）。' +
      '角色段落未注入，请检查 dsh 版本或插件依赖。'
    )
    return
  }

  const rawText = typeof cfg.text === 'string' ? cfg.text.trim() : ''
  const text = rawText || DOCS_ROLE
  const order = Number.isFinite(cfg.order) ? cfg.order : DEFAULT_ORDER
  const complete = cfg.complete === true

  if (cfg.complete !== undefined && cfg.complete !== true && cfg.complete !== false) {
    ctx.logger?.warn?.(
      'docs: `complete` 仅接受布尔 true；收到 ' +
      JSON.stringify(cfg.complete) + '，已忽略（本段不会成为完整 system prompt）。'
    )
  }

  ctx.effect(() => ctx.systemPrompt.section({
    name: cfg.name || 'dsh-docs:docs',
    order,
    text,
    ...(complete ? { complete: true } : {}),
  }), 'dsh-docs:docs')
}
