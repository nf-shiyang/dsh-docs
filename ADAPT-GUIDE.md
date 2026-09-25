# DSH 插件「技术文档工程师」— 适配与交接指南

> **用途**：当 DeepSeek Harness（dsh）大版本更新、本插件可能失效时，把**整个这个文件夹**整体发给任意 AI，让它照本指南核对并改写，使其兼容新版 dsh。

## 0. 一句话定位

这是 **dsh bundle 插件「技术文档工程师」**：向 dsh 的 system prompt 注入「技术文档工程师」单段角色。它是「高级开发工程师套件」的一员：

- `github:nf-shiyang/DSH` —— 开发本体（全栈开发 + PM）
- `github:nf-shiyang/dsh-reviewer` —— 代码评审
- `github:nf-shiyang/dsh-docs` —— **本插件（技术文档）**
- `github:nf-shiyang/dsh-devops` —— 部署运维

默认角色文本在 `index.js` 的 `DOCS_ROLE` 常量，可通过 `config.text` 整体替换。

## 1. 文件清单

| 文件 | 作用 |
|------|------|
| `index.js` | 主体（ESM）。`name='docs'` / `inject=['systemPrompt']` / `apply(ctx,config)`；注入单段 `DOCS_ROLE` |
| `cordis.patch.yml` | bundle 挂载声明 |
| `package.json` | dsh bundle 声明 + peer 依赖 |
| `README.md` / `LICENSE` / `.gitignore` | 配套 |

## 2. 兼容契约（新版 dsh 核对 5 点）

### 2.1 注入接口（最关键）
```js
ctx.effect(() => ctx.systemPrompt.section({
  name: cfg.name || 'dsh-docs:docs',
  order,                                   // 默认 61
  text,                                    // config.text 覆盖 或 内置 DOCS_ROLE
  ...(complete ? { complete: true } : {}),
}), 'dsh-docs:docs')
```

### 2.2 模块格式
```js
export const name = 'docs'
export const inject = ['systemPrompt']
export function apply(ctx, config = {}) { ... }
```

### 2.3 Bundle 分发格式
`package.json` 须含：`"type":"module"`、`"dsh":{"bundle":{"patch":"./cordis.patch.yml"}}`、`"keywords":["dsh-plugin"]`。

### 2.4 cordis.patch.yml
```yaml
- insert:
    - id: docs
      name: 'dsh-docs'
      config:
        order: 61
```

### 2.5 安装（0.1.x）
```sh
dsh plugin --profile web add github:nf-shiyang/dsh-docs
```

## 3. 已知良好版本
- 已验证兼容 **dsh 0.1.x**（含 0.1.7）。
- 依赖 cordis vendored 版本 `4.0.0-rc.7`。

## 4. 交给未来 AI 的执行清单
1. 核对 5 个契约点；2. 若 `section` 变则改 `index.js` 调用；3. 若 bundle 格式变则同步改；4. 更新 peer 版本；5. 更新 README 顶部版本；6. `node test/apply.test.mjs` 验证。

## 5. 备注（避免改坏）
- 角色文本 `DOCS_ROLE`（单段）。换角色改此常量或 `config.text`。
- `config.text` 空/非字符串时回退内置 `DOCS_ROLE`（务必保留）。
- `order` 默认 61；`complete:true` 会抑制其它段，慎用。
- 零运行时依赖。

## 6. 快速还原命令
```sh
node --check index.js && node test/apply.test.mjs && git add -A && git commit -m "feat: adapt to dsh <新版本>" && git push
```
