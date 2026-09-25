# dsh-docs

> ✅ 已验证兼容 DeepSeek Harness 0.1.7（核心注入 API 与 bundle 格式均未变；peerDependencies 对齐 `@deepseek-ai/cordis >=4.0.0-rc.7`）。

让 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）以「技术文档工程师」角色工作。

**这是「高级开发工程师套件」的独立文档插件**。与 `dsh-senior-developer`（开发本体，`github:nf-shiyang/DSH`）配合使用时，补齐「交付代码的同时产出匹配技术文档」的能力。不需要时直接卸载本插件即可，**不用改任何配置文件**。

## 特性

- **开箱即用**：默认内置「技术文档工程师」角色。
- **可换角色**：通过 `config.text` 整体替换为任意角色。
- **免构建**：纯 ESM JavaScript，`index.js` 既是源码也是发布产物。
- **零运行时依赖**：只依赖 `@deepseek-ai/dsh-base` 提供的 `systemPrompt` 服务。

## 安装

```sh
dsh plugin --profile web add github:nf-shiyang/dsh-docs
```

卸载：`dsh plugin --profile web remove dsh-docs`。
（也可用 Web UI：「添加插件」→ 粘贴 `github:nf-shiyang/dsh-docs` → 安装。）

## 配置项

| Key       | 默认              | 含义                                                  |
| --------- | ----------------- | ----------------------------------------------------- |
| `text`    | 内置文档角色      | 整体覆盖角色文本。                                    |
| `name`    | `dsh-docs:docs`   | section 名（同一 scope 层内须唯一）。                 |
| `order`   | `61`              | 排序值；排在开发核心段（50）之后。                   |
| `complete`| `false`           | `true` 时该段成为完整 system prompt，抑制其它段（慎用）。 |

## 验证 / 本地开发 / 发布

- 验证：`dsh --profile web --dump-config` 在 bundles 列表看到 `dsh-docs` 即挂载成功。
- 本地开发：测试 `node test/apply.test.mjs`（零依赖）。
- 发布：给仓库打 `dsh-plugin` 话题即可被社区聚合目录收录。

## License

[MIT](./LICENSE)
