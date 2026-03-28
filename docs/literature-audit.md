# 文献核对与阅读记录

本记录对应当前项目里的 20 条“区块链 + 心理咨询/医疗隐私/存证”参考文献，来源于 `scripts/outputs/project-text-dump.txt`。

说明：
- `已读-全文/长摘要` 表示我读到了开放获取全文，或至少读到了包含方法、结果、结论的长摘要页面。
- `已读-题录/元数据` 表示我只读到了官方题录、会议页或可靠二次索引，不能算完整通读全文。
- `未核实` 表示当前没有找到能支撑该条目真实性的可靠原始来源，或该条目与实际文献明显不符。

## 总体判断

- 这 20 条里，能稳定核实并读到摘要/全文的有 14 条。
- 至少 6 条存在明显问题：题名不准、年份不准、期刊不准、页码不准，或根本搜不到对应原文。
- 这份参考文献不能直接用于正式论文提交，必须先做一轮“逐条清洗”。

## 逐条记录

| 序号 | 当前条目状态 | 我读到的内容 | 主要问题 | 可核对来源 |
| --- | --- | --- | --- | --- |
| 1 | 已读-题录/元数据 | `A Blockchain-Based Electronic Mental Health Records Model`，已确认存在于 `ICITACEE 2023`，研究方向是区块链心理健康记录。 | 你文中写成 `2024 IEEE International Conference on Blockchain`，不对。更接近的真实出处是 `2023 10th ICITACEE`。 | IEEE Xplore 文献页；MDPI 论文参考文献中给出会议信息：`Semarang, 31 Aug-1 Sep 2023, pp. 320-325` |
| 2 | 已读-长摘要 | 论文提出面向心理健康机构的区块链患者门户，链上存储哈希和记录，链下做加密，采用以太坊与 BFT。 | 基本可核实。 | https://index.ieomsociety.org/index.cfm/article/view/ID/14405 |
| 3 | 已读-长摘要 | 真实论文为 `牛淑芬, 陈俐霞, 李文婷, 王彩芬, 杜小妮. 基于区块链的电子病历数据共享方案`，核心是私有链 + 联盟链 + 可搜索加密 + 代理重加密。 | 你文中的页码错了。真实页码是 `2028-2038`，不是 `1985-1996`。 | 自动化学报题录镜像；DOI `10.16383/j.aas.c190801` |
| 4 | 已读-长摘要 | 真实论文讨论联盟链下 EHR 共享与 `(p, α, k)` 匿名隐私算法。 | 你文中写成 `2019, 36(9): 2720-2724`，不对。真实条目是 `计算机应用研究, 2021, 38(1): 33-38`。 | https://www.arocmag.cn/abs/2019.09.0584 |
| 5 | 已读-全文/长摘要 | 真实论文提出 DID + PRE 的医疗数据共享框架，并在区块链上验证密文正确性，实现可验证与可审计。 | 这一条基本可信。 | https://crad.ict.ac.cn/article/doi/10.7544/issn1000-1239.202440351?viewType=HTML |
| 6 | 未核实 | 我没有找到与 `基于区块链技术的电子证据"存证—鉴真"模型[J]. 法学研究, 2024, 46(2): 123-140` 完全对应的原始论文。 | 高概率是错引、拼接引文，或把“区块链存证/电子数据鉴真”相关法学论文混写了。 | 目前只找到相关但非同文：谢登科《电子数据的技术性鉴真》以及若干区块链证据研究页面 |
| 7 | 已读-长摘要 | 真实论文是 `高改梅, 史旭, 刘春霞, 等. 一种基于区块链的医疗数据隐私保护方法`，核心是联盟链 + 分层隐私保护 + 群签名效率分析。 | 你文中年份和卷期不对。真实为 `计算机应用研究, 2024, 41(5): 1538-1543`。 | https://www.arocmag.cn/abs/2023.08.0392 |
| 8 | 已读-全文/长摘要 | 真实论文提出 `B-CoC`，用以太坊做数字取证中的 chain of custody，强调可审计完整性和持有人可追踪。 | 你文中年份写 `2019`，正式出版页显示为 `2020` 收录在 `Tokenomics 2019` 会议论文集中。 | https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.Tokenomics.2019.12 |
| 9 | 未核实 | 没有检索到 `Mura: A Web3 Application for Digital Evidence Preservation[D]. Princeton: Princeton University, 2023.` 的可靠 Princeton 原始仓储记录。 | 高概率是不存在、题名不完整，或学校/文献类型写错。 | 当前检索未命中 Princeton DataSpace 对应条目 |
| 10 | 已读-长摘要 | 可核实到真实文献为 `An Auditable Framework for Evidence Sharing and Management Using Smart Lockers and Distributed Technologies: Law Enforcement Use Case`，内容是 Hyperledger Fabric + IPFS + smart lockers 的证据管理框架。 | 你文中写成 `Edinburgh: Napier University, 2022 [D]`，不对。真实更像 `2024 Springer 会议论文/书章`，不是学位论文。 | https://napier-repository.worktribe.com/output/3176204/an-auditable-framework-for-evidence-sharing-and-management-using-smart-lockers-and-distributed-technologies-law-enforcement-use-case |
| 11 | 已读-全文/长摘要 | `ACHealthChain` 是真实开放获取论文，基于 Hyperledger Fabric + IPFS + PolicyChain/LogChain，做细粒度访问控制和审计。 | 这一条基本可信。 | https://www.nature.com/articles/s41598-025-00757-1 |
| 12 | 已读-题录/元数据 | 题名真实可检到，作者、期刊和年份能对上，研究主题是 EHR 隐私保持与访问控制。 | 暂未拿到公开摘要全文，只拿到可靠题录。 | J-GLOBAL 题录页；dblp 元数据页 |
| 13 | 未核实 | 我没有找到与你条目完全一致的 `Blockchain-Based Access Control for Electronic Health Records[C]//... Springer, 2024: 15-32.` | 高概率是把别的 EHR access control 论文题名改写后拼成的条目。 | 当前只检到相近但不同题目的开放论文，如 `Permissioned blockchain network for proactive access control to electronic health records` |
| 14 | 已读-长摘要 | 真实论文讨论多层次区块链 + 链上链下混合存储 + 差分隐私联邦学习，目标是降低医疗数据共享存储开销。 | 你文中卷期页码全错。真实为 `计算机应用研究, 2022, 39(5): 1307-1312,1318`。 | https://www.arocmag.cn/abs/2021.10.0426 |
| 15 | 已读-长摘要 | 检索到的真实相近论文是 `基于联盟链的医疗数据安全共享方案`，内容是联盟链 + CP-ABE + 智能合约 + 时间维度细粒度访问控制。 | 你文中题名、期刊、年份都不对。当前没找到 `上海大学学报(自然科学版), 2024, 30(12)` 这条。 | https://www.jas.shu.edu.cn/CN/10.3969/j.issn.0255-8297.2021.01.011 |
| 16 | 已读-长摘要 | 真实论文存在，内容是 IPFS + 混合加密 + 患者中心访问控制 + 智能合约。 | 你文中期刊写成 `Applied Informatics, 2024, 1(1)` 不对。真实来源是 `Acta Informatica Pragensia, 2024, 13(1): 1-23`。 | https://doaj.org/article/63006020a1694994920cb1a19a5f9d95 |
| 17 | 已读-全文/长摘要 | 真实开放获取论文，提出 blockchain-enabled encrypted RBAC + 同态加密，用于医疗数据隐私管理。 | 条目本身基本可核实，但这是 `2025-12-06` 发布的论文，时间较新。 | https://www.nature.com/articles/s41598-025-30916-3 |
| 18 | 已读-长摘要 | 真实论文针对隐私众包提出联盟链 + 零知识证明 + 可链接可撤销环签名，实现数据验证与可控匿名。 | 你文中页码错了。真实为 `电子与信息学报, 2024, 46(2): 748-756`，不是 `456-465`。 | USTC 教师主页与期刊检索页面；DOI `10.11999/JEIT230106` |
| 19 | 已读-全文/长摘要 | 真实论文讨论跨联盟链数据要素交易审计，核心是联盟链存证、中继链合约、Pedersen 承诺、Shamir 秘密分享和完整性审计。 | 这一条基本可信。 | https://crad.ict.ac.cn/article/doi/10.7544/issn1000-1239.202440472 |
| 20 | 已读-长摘要 | 检索到真实相近论文为 `姚可凡, 宋承坤, 王群, 陈宇琪. 基于区块链智能合约的存证与取证方法的设计与实现`，内容是私链 + Solidity + 去中心化证据存取。 | 你文中写成 `北京大学学报(自然科学版), 2024, 60(3): 456-468`，明显不对。真实检到的是 `网络安全技术与应用, 2023(07): 146-150`。 | https://ccj.pku.edu.cn/article/info?id=360265426 |

## 当前最重要的结论

1. 当前参考文献表不是“引用不规范”这么简单，而是存在多条错引、误引、拼接引文。
2. 如果直接把这份参考文献交上去，导师或答辩老师只要随机抽查几条，就能发现问题。
3. 现在最稳妥的路线不是继续往正文里硬塞文献，而是先把参考文献表洗干净，再反向修正文中的引用和论述。

## 建议的下一步

- 先保留已经核实的条目，按真实题录重写。
- 对 `6 / 9 / 13 / 15 / 20` 这类问题条目，重新找真实来源或直接删除。
- 把正文里依赖错误文献得出的句子逐段回查，避免“正文论断引用了不存在的文章”。
