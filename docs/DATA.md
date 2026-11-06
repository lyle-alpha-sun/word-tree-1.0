# 数据结构与来源

`public/data/` 是发行数据，没有个人开发资料或学习记录。

| 文件 | 用途与来源 |
| --- | --- |
| `ielts-book.json` | 词条、词形、关系、词根、局部中心页和索引；ECDICT/wordroot（MIT）、OEWN/Princeton WordNet 及自编记录 |
| `ielts-index.json` | 与词库一致的 `[word, groupIndex, pageIndex]` 中心索引 |
| `ielts-themes.json` | 项目整理的 18 个主题与词条映射 |
| `ielts-examples.json` | Tatoeba 双语例句（CC BY 2.0 FR）、明确标记的自编例句及已有搭配 |
| `ielts-etymology.json` | Wiktionary 贡献者的词史资料（CC BY-SA 4.0） |
| `ielts-frequency.json` | NGSL 1.2 与官方补充表的对照（CC BY-SA 4.0） |

`inflection` 是词典记录的语法变化，`derivation` 是已核对的派生关系，`association` 是有来源的词汇关联。WordNet 关系不能直接当作同根或历史借词证据。词根和借词链分别保留来源。

`words[word]` 包含 `zh`、`ipa`、`pos` 等字段，`t` 表示目标词，`formOf`/`formLabel`/`ex` 是已有词形资料。`groups` 是关系连通分量，每个成员有自己的 `pageCenters` 中心及 `pages` 局部页面；每页最多 12 词，页内关系连通，无关联的词独立展示。`roots`、`curatedEdges`、`inflectionEdges` 保留对应联系。

修改词条或图结构后应同步索引并运行 `npm run check:data`。发行包提供已整理数据和检查工具，没有把早期私人开发流水线作为公共再生成接口。旧 CatVar 分组和 `catvarPos` 数据不在公开包中。

高频再生成：

```bash
npm run data:frequency
npm run check:data
```

脚本只读随附的 `data-sources/ngsl/` 两张表和当前词库，无网络请求；只匹配原词或词典明确记载的原形。补充表的数字、月份等没有 NGSL 语料排名，只具有学习排序优先级。公开发行不包含 AWL 词表及其匹配结果。

Tatoeba 记录保留 `sentenceUrl`、`enId`、`zhId` 与许可；中文句子的贡献者页面可用 `https://tatoeba.org/en/sentences/show/{zhId}` 访问。修订译文和自编内容有对应标记。

Wiktionary 来源按词条链接 `https://en.wiktionary.org/wiki/{word}#English` 归属其贡献者，页面历史可追溯贡献者。语言链和旧义经过结构化、节选及中文整理，该衍生数据按 CC BY-SA 4.0 发行。软件 MIT 许可不改变第三方资料的署名或相同方式共享要求。
