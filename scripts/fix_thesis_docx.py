from __future__ import annotations

import copy
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PR_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
XML_NS = "http://www.w3.org/XML/1998/namespace"
NS = {"w": W_NS, "r": R_NS, "pr": PR_NS, "ct": CT_NS}

ET.register_namespace("w", W_NS)
ET.register_namespace("r", R_NS)


DOC_NAME = "基于区块链的校园心理咨询记录隐私保护与存证系统的设计与实现.docx"
TEMPLATE_PREFIX = "2026届本科毕业论文（设计）格式模版"


PARA_REPLACEMENTS = {
    "研究背景和意义": "1.1 研究背景和意义",
    "区块链是一种分布式账本技术，通过去中心化、不可篡改、可追溯等特性确保数据的安全性和可信度。在本系统中，区块链技术主要用于心理咨询记录与心理测评结果的存证留痕，解决传统心理咨询系统记录可篡改、难以追溯的问题。系统对预约、咨询记录、反馈、论坛内容、举报等关键操作生成存证记录，并通过链下存储原文、链上保存摘要哈希的方式实现关键数据的存证。该分层存证机制既保留了区块链在可信留痕和可追溯方面的优势，又避免将敏感咨询原文直接写入链上，从而兼顾隐私保护与可信存证需求，该设计与区块链服务安全及频谱共享研究中的可信协同思路一致[7][8]。":
    "区块链是一种分布式账本技术，通过去中心化、不可篡改、可追溯等特性确保数据的安全性和可信度。在本系统中，区块链技术主要用于心理咨询记录与心理测评结果的存证留痕，解决传统心理咨询系统记录可篡改、难以追溯的问题。系统对预约、咨询记录、反馈、论坛内容、举报等关键操作生成存证记录，并通过链下存储原文、链上保存摘要哈希的方式实现关键数据的存证。该分层存证机制既保留了区块链在可信留痕和可追溯方面的优势，又避免将敏感咨询原文直接写入链上，从而兼顾隐私保护与可信存证需求，该设计与区块链服务安全及频谱共享研究中的可信协同思路一致[7][8]。",
    "区块链是一种分布式账本技术，通过去中心化、不可篡改、可追溯等特性确保数据的安全性和可信度。在本系统中，区块链技术主要用于心理咨询记录与心理测评结果的存证留痕，解决传统心理咨询系统记录可篡改、难以追溯的问题。系统对预约、咨询记录、反馈、论坛内容、举报等关键操作生成存证记录，并通过链下存储原文、链上保存摘要哈希的方式实现关键数据的存证。该分层存证机制既保留了区块链在可信留痕和可追溯方面的优势，又避免将敏感咨询原文直接写入链上，从而兼顾隐私保护与可信存证需求，该设计与区块链服务安全研究中的可信协同思路一致[7]。":
    "区块链是一种分布式账本技术，通过去中心化、不可篡改、可追溯等特性确保数据的安全性和可信度。在本系统中，区块链技术主要用于心理咨询记录与心理测评结果的存证留痕，解决传统心理咨询系统记录可篡改、难以追溯的问题。系统对预约、咨询记录、反馈、论坛内容、举报等关键操作生成存证记录，并通过链下存储原文、链上保存摘要哈希的方式实现关键数据的存证。该分层存证机制既保留了区块链在可信留痕和可追溯方面的优势，又避免将敏感咨询原文直接写入链上，从而兼顾隐私保护与可信存证需求，该设计与区块链服务安全及频谱共享研究中的可信协同思路一致[7][8]。",
    "分层治理与差异化权限控制思路也与数字资产监管研究中的策略调适方向相契合[12]。":
    "区块链治理研究强调制度规则与技术实现需要协同设计[12]。",
    "智能合约与AI协同治理的工程经验也表明，将规则执行逻辑前置到链上有助于提升数据处理透明度与合规性[9]。":
    "相关研究表明，区块链与人工智能结合后能够在医疗与管理场景中提升数据可信传递与协同处理能力[9]。",
    "该类高并发业务处理模式与供应链溯源系统中对实时响应与多方协同的要求具有一致性[10]。":
    "相关区块链溯源系统研究表明，平台需要兼顾多方协同、实时响应与稳定的数据处理能力[10]。",
    "在多主体参与平台建设中，前端可用性与交互一致性同样是系统落地的重要因素[11]。":
    "多主体信息共享平台研究表明，前端界面的清晰导航与信息展示能力会直接影响系统落地效果[11]。",
    "数据库层对流程决策数据的稳定支撑，也与供应链减排决策系统中的数据一致性需求保持一致[13]。":
    "相关区块链决策研究表明，稳定的数据组织与一致性维护是系统分析能力的重要基础[13]。",
    "在高敏感业务中，这种认证机制对跨组织可信协作同样具有基础支撑作用[14]。":
    "已有区块链业务系统表明，身份确认与权限控制是保障平台安全运行的基础环节[14]。",
    "从心理服务系统的人机交互视角看，类型安全也有助于提升评估流程的稳定性与可解释呈现[15]。":
    "心理服务系统对信息表达的一致性和交互稳定性具有较高要求[15]。",
    "系统提供多种心理测评量表，包括情绪状态评估、焦虑与紧张评估、压力负荷评估、睡眠质量评估、社交能力评估等类型。支持题目滚动加载、自动计分与结果展示，允许用户查看历史测评记录，并确保测评结果仅在站内授权范围内可见。测评结果生成后，系统需自动创建测评存证记录，并对测评结果按固定字段生成哈希；当链上环境已配置时，系统应完成测评结果摘要哈希上链并保存交易哈希、区块高度、合约地址、修订版本等存证信息，便于后续审计与核验。如图3-2所示":
    "系统提供多种心理测评量表，包括情绪状态评估、焦虑与紧张评估、压力负荷评估、睡眠质量评估、社交能力评估等类型。支持题目滚动加载、自动计分与结果展示，允许用户查看历史测评记录，并确保测评结果仅在站内授权范围内可见。测评结果生成后，系统需自动创建测评存证记录，并对测评结果按固定字段生成哈希；当链上环境已配置时，系统应完成测评结果摘要哈希上链并保存交易哈希、区块高度、合约地址、修订版本等存证信息，便于后续审计与核验。如图3-2所示。",
    "心理咨询师需提交资质申请并上传附件，由管理员审核后才能开通咨询师权限。咨询师可设置可预约时段、服务方式（线上/线下/混合）与地点，并管理档期状态。档期支持可用、已预约、已取消等状态流转，咨询师仅可提前撤销本人尚未被预约的可预约时段，不能临时拒接已预约的咨询；已预约咨询仅允许来访者发起取消。如图3-3所示":
    "心理咨询师需提交资质申请并上传附件，由管理员审核后才能开通咨询师权限。咨询师可设置可预约时段、服务方式（线上/线下/混合）与地点，并管理档期状态。档期支持可用、已预约、已取消等状态流转，咨询师仅可提前撤销本人尚未被预约的可预约时段，不能临时拒接已预约的咨询；已预约咨询仅允许来访者发起取消。如图3-3所示。",
    "咨询记录、咨询存证与反馈模块覆盖会谈后的记录填写、摘要存证与满意度反馈流程。心理咨询师在预约完成后录入咨询摘要、问题分类、测评结论、干预建议、作业与跟进计划，并可标记危机情况；记录与预约绑定，仅对来访者本人、负责心理咨询师与管理员可见。咨询记录提交后，系统需自动创建咨询存证记录，对咨询记录摘要生成哈希，并在链上环境已配置时完成咨询摘要哈希上链，同时保存交易哈希、区块高度、合约地址和修订版本等信息。来访者在预约完成后提交1-5分评分、文字意见与点赞反馈，便于审计、统计与核验。如图3-4所示":
    "咨询记录、咨询存证与反馈模块覆盖会谈后的记录填写、摘要存证与满意度反馈流程。心理咨询师在预约完成后录入咨询摘要、问题分类、测评结论、干预建议、作业与跟进计划，并可标记危机情况；记录与预约绑定，仅对来访者本人、负责心理咨询师与管理员可见。咨询记录提交后，系统需自动创建咨询存证记录，对咨询记录摘要生成哈希，并在链上环境已配置时完成咨询摘要哈希上链，同时保存交易哈希、区块高度、合约地址和修订版本等信息。来访者在预约完成后提交1-5分评分、文字意见与点赞反馈，便于审计、统计与核验。如图3-4所示。",
    "系统提供社区讨论与互助功能，用户可发布帖子、评论与点赞，支持一级与二级评论结构。帖子需经过管理员审核后展示，杜绝匿名发布，确保内容可追溯。评论和聊天可以实时发送，但帖子发布需要审核，以保护心理敏感人群。用户可对帖子、评论或用户进行举报，提交文字说明与附件。管理员统一审核处理并记录处理结果，包括封禁账号、删除恶意评论、处理心理师态度问题等。举报创建时自动生成存证记录，处理结果通知举报人。如图3-5所示":
    "系统提供社区讨论与互助功能，用户可发布帖子、评论与点赞，支持一级与二级评论结构。帖子需经过管理员审核后展示，杜绝匿名发布，确保内容可追溯。评论和聊天可以实时发送，但帖子发布需要审核，以保护心理敏感人群。用户可对帖子、评论或用户进行举报，提交文字说明与附件。管理员统一审核处理并记录处理结果，包括封禁账号、删除恶意评论、处理心理师态度问题等。举报创建时自动生成存证记录，处理结果通知举报人。如图3-5所示。",
    "系统需实现站内消息与即时聊天，支持系统消息、好友消息与好友申请。聊天记录采用滚动加载机制，支持撤回与删除操作，并在消息列表提示未读数量。消息中心统一管理各类通知，包括预约结果、提醒、举报处理结果等。如图3-6所示":
    "系统需实现站内消息与即时聊天，支持系统消息、好友消息与好友申请。聊天记录采用滚动加载机制，支持撤回与删除操作，并在消息列表提示未读数量。消息中心统一管理各类通知，包括预约结果、提醒、举报处理结果等。如图3-6所示。",
    "管理员可进行咨询师审核（审核资质、授权上岗）、内容审核（论坛帖子审核）、举报处理、数据统计（预约量、完成率、满意度、问题分类分布、测评结果分布、危机事件统计）与公告发布，并具备重置密码与禁用账号的权限。如图3-7所示":
    "管理员可进行咨询师审核（审核资质、授权上岗）、内容审核（论坛帖子审核）、举报处理、数据统计（预约量、完成率、满意度、问题分类分布、测评结果分布、危机事件统计）与公告发布，并具备重置密码与禁用账号的权限。如图3-7所示。",
    "表 6-1部分系统模块测试表": "表 6-1 部分系统模块测试表",
    "表6-2集成用例表": "表 6-2 集成用例表",
    "测试结果表明系统能稳定支撑校园心理咨询的主要业务流程，功能正确性与可用性满足预期。各模块功能测试通过，集成测试验证了系统各模块协作正常，性能测试显示系统响应速度满足需求。":
    "测试结果表明系统能稳定支撑校园心理咨询的主要业务流程，功能正确性与可用性满足预期。各模块功能测试通过，集成测试验证了系统各模块协作正常，性能测试显示系统响应速度满足需求。综合来看，系统已经能够较完整地覆盖“用户注册登录、心理测评、咨询预约、记录填写、反馈评价、存证留痕、社区互动、审核管理”的核心链路，说明本研究提出的系统方案具有较好的工程可行性。",
    "当前系统已实现链上存证功能，但仍以基础存证流程和本地测试环境验证为主；消息与论坛内容的合规审核能力仍可细化（例如敏感词检测、举报分级处理）；统计维度可扩展到更细粒度的危机预警与测评趋势分析。":
    "当前系统已实现链上存证功能，但仍以基础存证流程和本地测试环境验证为主；消息与论坛内容的合规审核能力仍可细化（例如敏感词检测、举报分级处理）；统计维度可扩展到更细粒度的危机预警与测评趋势分析。除此之外，系统在工程层面仍存在若干提升空间：其一，链上存证目前主要面向摘要哈希登记，尚未形成更完善的回执重试、批量补录和异常告警机制；其二，测试工作以功能验证为主，对高并发、弱网、异常恢复和安全攻防场景的覆盖还不够充分；其三，数据分析功能目前偏向结果统计，对长期趋势、群体差异和危机信号联动识别的支撑仍较有限。这些问题说明系统已经具备可运行原型，但距离成熟应用平台仍需要继续迭代。",
    "后续将进一步完善联盟链或许可链部署方案，优化存证验证流程与链上确认体验；探索同态加密、联邦学习等隐私计算能力，支持跨部门数据分析；优化用户体验与移动端适配，提升咨询服务的可达性与响应效率。":
    "后续将进一步完善联盟链或许可链部署方案，优化存证验证流程与链上确认体验；探索同态加密、联邦学习等隐私计算能力，支持跨部门数据分析；优化用户体验与移动端适配，提升咨询服务的可达性与响应效率。面向真实校园场景，还可以继续从三个方向深化研究：一是完善智能预警与辅助决策能力，将测评结果、咨询记录和风险标签进行联动分析，为管理端提供更及时的风险提示；二是强化多端协同与可访问性设计，提升移动端、低带宽环境和不同角色用户的使用体验；三是完善制度与技术结合的审计机制，在保障隐私的前提下，使关键业务操作、审核过程和存证结果形成更完整的闭环，为校园心理服务治理提供长期支撑。",
}

INSERT_AFTER = {
    "相关研究表明，区块链与人工智能结合后能够在医疗与管理场景中提升数据可信传递与协同处理能力[9]。": [
        "在本系统中，智能合约并不直接保存完整咨询正文，而是承担摘要哈希登记、时间戳固化、修订版本记录和链上结果返回等职责。系统先在链下对测评结果和咨询记录的关键字段构造规范化摘要，再对摘要执行哈希运算，并将哈希值写入合约。这样既避免了敏感原文直接上链，又保留了后续核验时可对照、可追溯、可审计的证据基础。"
    ],
    "相关区块链溯源系统研究表明，平台需要兼顾多方协同、实时响应与稳定的数据处理能力[10]。": [
        "Node.js 采用事件驱动和非阻塞 I/O 机制，适合处理本系统中的登录认证、预约提交、消息通知、举报流转与存证补录等高频接口请求。对校园心理咨询平台而言，请求通常具有并发量较高、单次处理链路较短、接口联动较多的特点，Node.js 能够较好地承担这一类服务编排任务。"
    ],
    "多主体信息共享平台研究表明，前端界面的清晰导航与信息展示能力会直接影响系统落地效果[11]。": [
        "本系统前端采用 Next.js 构建多角色门户界面，利用文件路由和组件化方式组织注册、测评、预约、记录、反馈、论坛和管理端页面。该框架能够较好地兼顾首屏加载效率、页面复用能力和工程可维护性，也便于后续继续扩展移动端适配、统一布局和角色化导航等功能。"
    ],
    "相关区块链决策研究表明，稳定的数据组织与一致性维护是系统分析能力的重要基础[13]。": [
        "MySQL 作为关系型数据库，能够较好地支撑用户、预约、咨询记录、反馈、论坛、举报、通知和存证等多个业务实体之间的关联关系。系统通过主键、外键、状态字段和时间字段维护业务流转一致性，并为统计分析、责任追溯和链下核验提供稳定的数据基础，因此适合作为本系统的核心持久化存储方案。"
    ],
    "已有区块链业务系统表明，身份确认与权限控制是保障平台安全运行的基础环节[14]。": [
        "JWT 认证机制用于维护登录态和角色信息，后端在用户通过邮箱和密码验证后签发 Token，前端在后续请求中附带 Token 访问受保护接口。系统再结合 RBAC 机制，对普通用户、心理咨询师和管理员进行细粒度授权，确保不同角色只能访问与自身职责相匹配的数据和功能，从而提升接口鉴权的一致性和可追踪性。"
    ],
    "心理服务系统对信息表达的一致性和交互稳定性具有较高要求[15]。": [
        "TypeScript 为前后端统一的数据结构约束提供了良好支持。无论是预约状态、咨询记录字段、反馈载荷，还是存证记录返回结果，都可以在编译阶段进行类型检查，降低字段拼写错误、空值处理不当和接口结构不一致带来的隐患。对于涉及敏感数据和多模块协作的校园心理咨询系统而言，类型安全直接关系到系统维护过程中的稳定性和可测试性。"
    ],
    "心理咨询系统的性能测试主要考察并发处理能力，验证多用户同时登录和操作时系统的稳定性，避免系统性能下降或服务中断，测试内容包括多用户登录状态验证及登录后的功能操作流畅性。测试数据如图6-3所示。": [
        "本研究在本地开发环境中对注册登录、预约提交、咨询记录保存、消息通知与举报处理等典型接口进行了连续访问测试，重点观察接口响应是否稳定、数据库写入是否一致以及异常情况下是否能够返回统一错误信息。测试过程中通过多账户交替登录、重复提交预约、连续创建论坛内容和批量查询记录等方式模拟校园场景下的高频操作，以验证系统在常见负载下的可用性与稳定性。",
        "从测试结果看，前端页面能够完成主要业务流程的快速跳转与结果反馈；后端接口在权限校验、参数校验和状态流转方面未出现明显异常；数据库记录与页面展示结果基本保持一致。虽然本研究尚未在真实生产环境中开展大规模压测，但现有测试结果表明系统已经具备支撑校园心理咨询日常业务运行的基础能力。"
    ],
    "集成测试主要测试系统的多个模块如何协作，确保各功能模块能够协调运行，优化终端用户的交互体验。部分集成用例如表6-2所示。": [
        "在集成测试过程中，本文重点验证了多角色登录后的权限隔离、预约完成后咨询记录与反馈的串联关系、举报提交后管理员处理与消息通知的闭环，以及存证记录与业务数据之间的一致性。测试结果表明，系统在典型跨模块流程中能够保持较稳定的数据联动关系，说明前端页面、后端接口、数据库和存证模块之间已经形成较完整的协同机制。"
    ],
    "咨询记录模块前端提供记录填写表单，后端提供记录提交接口，记录创建时自动生成存证记录。为实现咨询存证，系统以 consultationId、appointmentId、咨询摘要、干预建议和更新时间等字段构造规范化摘要并计算哈希，在链上配置可用时调用咨询存证合约完成上链，并将 recordHash、txHash、blockNumber、chainId、contractAddress、revision 和 recordedAt 等结果写回本地存证记录。反馈模块前端提供满意度反馈表单，后端提供反馈提交接口，支持点赞功能。系统生成统计数据供咨询师与管理员查看。如图4-5所示。": [
        "在系统设计层面，该模块采用“预约驱动、记录绑定、分级查看、摘要存证”的处理链路。只有与已完成预约关联的咨询师才允许创建记录，记录提交后与 appointmentId 建立唯一对应关系，避免脱离业务上下文单独形成咨询档案；来访者、咨询师与管理员分别依据职责查看不同粒度的数据与统计结果，从流程设计上缩小敏感信息暴露范围，并为后续责任追溯和业务核验保留清晰边界。"
    ],
    "咨询记录、咨询存证与反馈模块是系统的核心功能之一。咨询师在完成会谈后填写咨询记录，后端将记录信息与预约信息绑定后写入咨询记录表，并同步创建咨询存证记录。系统对 consultationId、appointmentId、咨询摘要、问题分类、干预建议、作业和更新时间等字段构造规范化 JSON 摘要并计算 keccak256 哈希；当咨询存证合约已部署且链上配置可用时，系统调用 ConsultationEvidenceRegistry 合约写入咨询摘要哈希，并将交易哈希、区块高度、链标识、合约地址、修订版本和链上记录时间写回本地存证记录。用户对已完成咨询提交满意度反馈与点赞后，反馈数据仍保留在业务系统中供统计查询，而咨询记录的摘要哈希则可通过存证查询接口与链上最新记录进行一致性校验。咨询记录与反馈页面如图5-4所示。": [
        "在具体实现上，前端页面会优先拉取当前咨询师名下已完成预约的数据作为记录填写上下文，减少重复录入；提交时先对咨询摘要、问题分类、干预建议和作业等字段进行必填校验，后端通过参数校验后再依次完成咨询记录落库、存证记录创建与审计日志登记。若链上写入暂不可用，则系统将存证状态标记为待同步，保证核心咨询业务可先完成入库，后续再通过补录机制完成链上确认，从而提升整体流程的鲁棒性。"
    ],
    "本文围绕校园心理咨询记录的隐私保护与存证留痕展开，完成了基于 Next.js + Koa + MySQL 的系统设计与实现。系统覆盖注册登录、心理测评、预约与档期、咨询记录与反馈、论坛社区、消息聊天、举报审核与管理员管理等流程，通过 RBAC 与存证记录表实现权限控制与审计留痕，并结合区块链存证模块完成关键业务数据摘要的链上存证。": [
        "从论文工作来看，本文不仅完成了业务需求分析、系统架构设计与核心模块实现，还结合校园心理咨询场景对“链下存储、链上存证、角色分级授权、关键操作留痕”等问题进行了工程化整合。研究结果说明，将区块链存证能力引入校园心理咨询信息系统是可行的，能够在不直接暴露敏感原文的前提下提升数据可信度与后续核验能力。"
    ],
}


def qn(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def get_text(elem: ET.Element) -> str:
    text = "".join(t.text or "" for t in elem.findall(".//w:t", NS))
    return " ".join(text.split()).strip()


def clear_content(paragraph: ET.Element) -> None:
    ppr = paragraph.find("w:pPr", NS)
    for child in list(paragraph):
        if child is not ppr:
            paragraph.remove(child)


def ensure_ppr(paragraph: ET.Element) -> ET.Element:
    ppr = paragraph.find("w:pPr", NS)
    if ppr is None:
        ppr = ET.Element(qn(W_NS, "pPr"))
        paragraph.insert(0, ppr)
    return ppr


def set_style(paragraph: ET.Element, style_id: str) -> None:
    ppr = ensure_ppr(paragraph)
    pstyle = ppr.find("w:pStyle", NS)
    if pstyle is None:
        pstyle = ET.SubElement(ppr, qn(W_NS, "pStyle"))
    pstyle.set(qn(W_NS, "val"), style_id)
    num_pr = ppr.find("w:numPr", NS)
    if num_pr is not None:
        ppr.remove(num_pr)


def make_text_run(text: str, superscript: bool = False) -> ET.Element:
    run = ET.Element(qn(W_NS, "r"))
    if superscript:
        rpr = ET.SubElement(run, qn(W_NS, "rPr"))
        vert = ET.SubElement(rpr, qn(W_NS, "vertAlign"))
        vert.set(qn(W_NS, "val"), "superscript")
    t = ET.SubElement(run, qn(W_NS, "t"))
    if text.startswith(" ") or text.endswith(" "):
        t.set(qn(XML_NS, "space"), "preserve")
    t.text = text
    return run


def set_plain_text(paragraph: ET.Element, text: str, superscript_refs: bool = False) -> None:
    clear_content(paragraph)
    if not superscript_refs:
        paragraph.append(make_text_run(text))
        return
    parts = re.split(r"(\[\d+\])", text)
    for part in parts:
        if not part:
            continue
        paragraph.append(make_text_run(part, superscript=bool(re.fullmatch(r"\[\d+\]", part))))


def clone_paragraph(base: ET.Element, text: str, style_id: str | None = None) -> ET.Element:
    new_p = copy.deepcopy(base)
    set_plain_text(new_p, text)
    if style_id:
        set_style(new_p, style_id)
    else:
        ppr = ensure_ppr(new_p)
        num_pr = ppr.find("w:numPr", NS)
        if num_pr is not None:
            ppr.remove(num_pr)
    return new_p


def paragraph_texts_after(body: ET.Element, paragraph: ET.Element, count: int) -> list[str]:
    texts: list[str] = []
    seen = False
    for child in list(body):
        if not seen:
            if child is paragraph:
                seen = True
            continue
        if child.tag != qn(W_NS, "p"):
            continue
        texts.append(get_text(child))
        if len(texts) >= count:
            break
    return texts


def merge_styles(current_styles: ET.Element, template_styles: ET.Element) -> None:
    wanted = {"2", "3", "4", "6", "9", "10", "12", "35", "55"}
    for style_id in wanted:
        existing = current_styles.find(f"w:style[@w:styleId='{style_id}']", NS)
        if existing is not None:
            current_styles.remove(existing)
        template_style = template_styles.find(f"w:style[@w:styleId='{style_id}']", NS)
        if template_style is not None:
            current_styles.append(copy.deepcopy(template_style))


def ensure_settings(settings: ET.Element) -> None:
    if settings.find("w:evenAndOddHeaders", NS) is None:
        settings.append(ET.Element(qn(W_NS, "evenAndOddHeaders")))
    update = settings.find("w:updateFields", NS)
    if update is None:
        update = ET.Element(qn(W_NS, "updateFields"))
        settings.append(update)
    update.set(qn(W_NS, "val"), "true")


def ensure_override(content_types: ET.Element, part_name: str) -> None:
    for override in content_types.findall("ct:Override", NS):
        if override.get("PartName") == part_name:
            return
    new_override = ET.Element(qn(CT_NS, "Override"))
    new_override.set("PartName", part_name)
    new_override.set(
        "ContentType",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml",
    )
    content_types.append(new_override)


def ensure_relationship(rels: ET.Element, rel_id: str, rel_type: str, target: str) -> None:
    for rel in rels.findall("pr:Relationship", NS):
        if rel.get("Id") == rel_id:
            rel.set("Type", rel_type)
            rel.set("Target", target)
            return
    new_rel = ET.Element(qn(PR_NS, "Relationship"))
    new_rel.set("Id", rel_id)
    new_rel.set("Type", rel_type)
    new_rel.set("Target", target)
    rels.append(new_rel)


def build_header(title_text: str, chapter_field: bool = False) -> bytes:
    hdr = ET.Element(qn(W_NS, "hdr"))
    p = ET.SubElement(hdr, qn(W_NS, "p"))
    ppr = ET.SubElement(p, qn(W_NS, "pPr"))
    jc = ET.SubElement(ppr, qn(W_NS, "jc"))
    jc.set(qn(W_NS, "val"), "center")
    if chapter_field:
        p.append(ET.Element(qn(W_NS, "r")))
        p[-1].append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "begin"}))
        instr_run = ET.SubElement(p, qn(W_NS, "r"))
        instr = ET.SubElement(instr_run, qn(W_NS, "instrText"))
        instr.set(qn(XML_NS, "space"), "preserve")
        instr.text = ' STYLEREF 2 \\\\* MERGEFORMAT '
        sep_run = ET.SubElement(p, qn(W_NS, "r"))
        sep_run.append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "separate"}))
        text_run = ET.SubElement(p, qn(W_NS, "r"))
        ET.SubElement(text_run, qn(W_NS, "t")).text = "章节标题"
        end_run = ET.SubElement(p, qn(W_NS, "r"))
        end_run.append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "end"}))
    else:
        p.append(make_text_run(title_text))
    return ET.tostring(hdr, encoding="utf-8", xml_declaration=True)


def build_footer() -> bytes:
    ftr = ET.Element(qn(W_NS, "ftr"))
    p = ET.SubElement(ftr, qn(W_NS, "p"))
    ppr = ET.SubElement(p, qn(W_NS, "pPr"))
    jc = ET.SubElement(ppr, qn(W_NS, "jc"))
    jc.set(qn(W_NS, "val"), "center")
    begin = ET.SubElement(p, qn(W_NS, "r"))
    begin.append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "begin"}))
    instr_run = ET.SubElement(p, qn(W_NS, "r"))
    instr = ET.SubElement(instr_run, qn(W_NS, "instrText"))
    instr.set(qn(XML_NS, "space"), "preserve")
    instr.text = " PAGE "
    sep = ET.SubElement(p, qn(W_NS, "r"))
    sep.append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "separate"}))
    result = ET.SubElement(p, qn(W_NS, "r"))
    ET.SubElement(result, qn(W_NS, "t")).text = "1"
    end = ET.SubElement(p, qn(W_NS, "r"))
    end.append(ET.Element(qn(W_NS, "fldChar"), {qn(W_NS, "fldCharType"): "end"}))
    return ET.tostring(ftr, encoding="utf-8", xml_declaration=True)


def update_section_refs(section: ET.Element, default_header: str | None, even_header: str | None, footer: str | None, page_fmt: str | None = None, page_start: str | None = None) -> None:
    for child in list(section):
        local = child.tag.split("}")[-1]
        if local in {"headerReference", "footerReference"}:
            section.remove(child)
    if default_header:
        ref = ET.Element(qn(W_NS, "headerReference"))
        ref.set(qn(W_NS, "type"), "default")
        ref.set(qn(R_NS, "id"), default_header)
        section.insert(0, ref)
    if even_header:
        ref = ET.Element(qn(W_NS, "headerReference"))
        ref.set(qn(W_NS, "type"), "even")
        ref.set(qn(R_NS, "id"), even_header)
        section.insert(1 if default_header else 0, ref)
    if footer:
        ref = ET.Element(qn(W_NS, "footerReference"))
        ref.set(qn(W_NS, "type"), "default")
        ref.set(qn(R_NS, "id"), footer)
        section.insert(2 if default_header and even_header else 1 if (default_header or even_header) else 0, ref)
    if page_fmt:
        pg = section.find("w:pgNumType", NS)
        if pg is None:
            pg = ET.Element(qn(W_NS, "pgNumType"))
            section.insert(0, pg)
        pg.set(qn(W_NS, "fmt"), page_fmt)
        if page_start:
            pg.set(qn(W_NS, "start"), page_start)
        elif qn(W_NS, "start") in pg.attrib:
            del pg.attrib[qn(W_NS, "start")]


def main() -> None:
    root = Path.cwd()
    thesis_path = next(p for p in root.rglob("*.docx") if p.name == DOC_NAME)
    template_path = next(p for p in root.rglob("*.docx") if p.name.startswith(TEMPLATE_PREFIX))

    with zipfile.ZipFile(thesis_path) as thesis_zip:
        entries = {name: thesis_zip.read(name) for name in thesis_zip.namelist()}
    with zipfile.ZipFile(template_path) as template_zip:
        template_styles = ET.fromstring(template_zip.read("word/styles.xml"))

    doc = ET.fromstring(entries["word/document.xml"])
    styles = ET.fromstring(entries["word/styles.xml"])
    settings = ET.fromstring(entries["word/settings.xml"])
    rels = ET.fromstring(entries["word/_rels/document.xml.rels"])
    content_types = ET.fromstring(entries["[Content_Types].xml"])

    merge_styles(styles, template_styles)
    ensure_settings(settings)

    body = doc.find("w:body", NS)
    assert body is not None

    # update TOC field to include three heading levels
    for p in body.findall("w:p", NS):
        text = get_text(p)
        if text == "目 录":
            for instr in p.findall(".//w:instrText", NS):
                if instr.text and "TOC " in instr.text:
                    instr.text = 'TOC \\o "1-3" \\h \\u'
            break

    # text replacements and insertions
    body_children = list(body)
    inserted_templates: dict[str, ET.Element] = {}
    i = 0
    while i < len(body_children):
        child = body_children[i]
        if child.tag != qn(W_NS, "p"):
            i += 1
            continue
        text = get_text(child)
        if text in PARA_REPLACEMENTS:
            set_plain_text(child, PARA_REPLACEMENTS[text])
            text = PARA_REPLACEMENTS[text]
        if text in INSERT_AFTER:
            base = copy.deepcopy(child)
            insert_index = list(body).index(child) + 1
            extras = INSERT_AFTER[text]
            if paragraph_texts_after(body, child, len(extras)) != extras:
                for extra in extras:
                    new_p = clone_paragraph(base, extra, "6")
                    body.insert(insert_index, new_p)
                    insert_index += 1
            body_children = list(body)
        i += 1

    paragraphs = body.findall("w:p", NS)

    in_body = False
    in_refs = False
    for p in paragraphs:
        text = get_text(p)
        if text == "1 绪论":
            in_body = True
            in_refs = False
        elif text == "参考文献":
            in_refs = True
        elif text == "致谢":
            in_refs = False

        if text == "参考文献" or text == "致谢" or re.match(r"^\d+\s+\S", text):
            set_style(p, "2")
        elif re.match(r"^\d+\.\d+\s+\S", text):
            set_style(p, "3")
        elif re.match(r"^\d+\.\d+\.\d+\s+\S", text):
            set_style(p, "4")
        elif re.match(r"^(图|表)\s*\d", text) or re.match(r"^续表\s*\d", text):
            set_style(p, "12")
        elif in_refs and text:
            set_style(p, "35")
        elif in_body and text and text != "目 录":
            set_style(p, "6")

        if in_body and not in_refs and re.search(r"\[\d+\]", text):
            set_plain_text(p, text, superscript_refs=True)

    # relationships / content types / headers / footers
    ensure_relationship(
        rels,
        "rId29",
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
        "header2.xml",
    )
    ensure_override(content_types, "/word/header2.xml")
    entries["word/header1.xml"] = build_header(
        "校园心理咨询隐私保护与存证系统设计与实现",
        chapter_field=False,
    )
    entries["word/header2.xml"] = build_header("", chapter_field=True)
    entries["word/footer1.xml"] = ET.tostring(
        ET.Element(qn(W_NS, "ftr")), encoding="utf-8", xml_declaration=True
    )
    entries["word/footer2.xml"] = build_footer()
    entries["word/footer3.xml"] = build_footer()

    sects = doc.findall(".//w:sectPr", NS)
    if len(sects) >= 4:
        update_section_refs(sects[0], None, None, "rId3")
        update_section_refs(sects[1], None, None, "rId4", page_fmt="upperRoman", page_start="1")
        update_section_refs(sects[2], "rId5", "rId29", "rId6", page_fmt="decimal", page_start="1")
        update_section_refs(sects[3], "rId5", "rId29", "rId6", page_fmt="decimal")

    entries["word/document.xml"] = ET.tostring(doc, encoding="utf-8", xml_declaration=True)
    entries["word/styles.xml"] = ET.tostring(styles, encoding="utf-8", xml_declaration=True)
    entries["word/settings.xml"] = ET.tostring(settings, encoding="utf-8", xml_declaration=True)
    entries["word/_rels/document.xml.rels"] = ET.tostring(rels, encoding="utf-8", xml_declaration=True)
    entries["[Content_Types].xml"] = ET.tostring(content_types, encoding="utf-8", xml_declaration=True)

    backup_path = thesis_path.with_suffix(".bak.docx")
    if not backup_path.exists():
        backup_path.write_bytes(thesis_path.read_bytes())

    output_path = thesis_path
    try:
        with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as out:
            for name, data in entries.items():
                out.writestr(name, data)
    except PermissionError:
        output_path = thesis_path.with_name(f"{thesis_path.stem}-修订版{thesis_path.suffix}")
        with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as out:
            for name, data in entries.items():
                out.writestr(name, data)

    print(f"Updated {output_path}")
    print(f"Backup   {backup_path}")


if __name__ == "__main__":
    main()
