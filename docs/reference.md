<img src="media/image1.png" style="width:5.18176in;height:0.87915in" />

> 本科毕业论文（设计）
>
> **题目：<u>基于React古籍收藏管理系统的设计与实现</u>**
>
> 学生姓名 <u>胡熠煊</u>
>
> 学 号 <u>202101423</u>
>
> 学 院 <u>区块链学院</u>
>
> 专业班级 <u>区块链技术B210601</u>
>
> 指导教师

二〇二五年六月

> **江西软件职业技术大学毕业论文（设计）原创性声明和使用授权声明**

**1.毕业论文（设计）原创性声明**

本人声明所呈交的毕业论文（设计），是本人在指导教师指导下进行的研究工作及
取得的研究成果。除文中已经注明引用的内容外，本设计（论文）不包含其他个人或集
体已经发表或撰写的作品。对本文的研究做出重要贡献的个人和集体，均已在文中标明。

> 本声明的法律后果由本人承担。
>
> 学生签名：
>
> 年 月 日

**2.毕业论文（设计）使用授权声明**

本人完全了解江西软件职业技术大学有关收集、保存、使用毕业论文（设计） 的
规定。

本人愿意按照学校要求提交毕业论文（设计）的印刷本和电子版，同意毕业论文
（设计）的印刷本和电子版采用影印、缩印、数字化或其它复制手段保存；同意学校在不
以营利为目的的前提下，建立目录检索与阅览服务系统，公布毕业论文（设计）的部分或
全部内容，允许他人依法合理使用。

> 注：保密的毕业论文（设计）在解密后遵守此规定。
>
> 学生签名：
>
> 年 月 日

摘 要

古籍以实物形式保存着中华优秀传统文化，承载着极高的历史价值与文化价值。古籍数字化是指借助现代技术手段，将承载千年文明的传统典籍转化为数字文档，并通过数字化技术实现文献的保存、管理、分析和共享。目前古籍数字化研究多停留在理论研究和单纯的古籍文件整理方面，传统的古籍数字化系统也存在社会化参与度小的问题，因此，需要一套创新性的系统解决此问题。

本研究前端采用React技术，后端采用Express框架，以此为技术基础构建一个基于React的古籍收藏系统。该系统集古籍的数字化信息和古籍管理于一体，并且在此基础上添加交流区模块，提高了古籍社会化主体的参与程度，从而提高社会化主体对古籍保护的支持度和参与度，使古籍得到更好的传承与发展。

本研究旨在解决古籍数字化领域在社会化程度方面存在的问题，并提出了相应的解决方案。本系统极大的提高了关于古籍收藏和数字化保护在社会层面的参与度，使其古籍保护更加大众化、社会化、普及化，为未来古籍保护提供了强有力的系统支撑。

【关键词】古籍收藏；React；古籍数字化；Express框架

Abstract

Ancient books preserve the excellent traditional Chinese culture in the
form of physical objects, carrying high historical value and cultural
value. The digitization of ancient books refers to the use of modern
technology to transform the traditional books carrying thousands of
years of civilization into digital documents, and to realize the
preservation, management, analysis and sharing of documents through
digital technology. At present, the research of ancient book
digitization mostly stays in the theoretical research and purely ancient
book document arrangement, and the traditional ancient book digitization
system also has the problem of small social participation, therefore, an
innovative system is needed to solve this problem.

In this study, React technology is used in the front-end and Express
framework is used in the back-end to build a React-based ancient book
collection system. The system integrates the digitized information of
ancient books and the management of ancient books, and adds the
communication area module on the basis of this system, which improves
the degree of participation of the subject of the socialization of
ancient books, so as to improve the support and participation of the
subject of the socialization of the protection of ancient books, and to
make the ancient books get a better inheritance and development.

This study aims to solve the problems in the field of digitization of
ancient books in terms of the degree of socialization, and proposes a
corresponding solution. This system greatly improves the degree of
participation about the collection and digital protection of ancient
books at the social level, makes its protection of ancient books more
popular, socialized and popularized, and provides a strong system
support for the protection of ancient books in the future.

【Key words】Antiquarian book collection;React;Digitization of Ancient
Books;Express Framework

**目 录**

[**1 绪论 [1](#_Toc7548)**](#_Toc7548)

[1.1 研究背景和意义 [1](#_Toc7410)](#_Toc7410)

[1.2 国内外研究现状 [2](#_Toc16247)](#_Toc16247)

[1.3 研究内容与目标 [2](#_Toc3346)](#_Toc3346)

[**2 需求分析 [3](#_Toc5883)**](#_Toc5883)

[2.1 系统功能需求 [3](#_Toc17671)](#_Toc17671)

[2.2 非功能需求 [5](#_Toc22714)](#_Toc22714)

[2.3 系统用例图 [5](#_Toc4497)](#_Toc4497)

[**3 系统设计 [7](#_Toc29892)**](#_Toc29892)

[3.1 系统总体框架设计 [7](#_Toc1253)](#_Toc1253)

[3.2 前端框架与后端逻辑设计 [8](#_Toc14242)](#_Toc14242)

[3.3 数据库设计 [9](#_Toc12433)](#_Toc12433)

[**4 系统功能模块实现 [12](#_Toc20221)**](#_Toc20221)

[4.1 登录与注册模块的实现 [12](#_Toc10265)](#_Toc10265)

[4.2 古籍上传模块的实现 [16](#_Toc21572)](#_Toc21572)

[4.3 古籍管理模块的实现 [18](#_Toc17039)](#_Toc17039)

[4.4 古籍分类与展示模块的实现 [19](#_Toc19083)](#_Toc19083)

[4.5 用户管理模块的实现 [21](#_Toc19164)](#_Toc19164)

[4.6 轮播图管理模块的实现 [23](#_Toc13936)](#_Toc13936)

[4.7 资讯模块的实现 [24](#_Toc31371)](#_Toc31371)

[4.8 交流区模块的实现 [26](#_Toc9135)](#_Toc9135)

[4.9 个人信息中心模块的实现 [28](#_Toc17871)](#_Toc17871)

[**5 系统测试与评估 [31](#_Toc7573)**](#_Toc7573)

[5.1 系统模块测试 [31](#_Toc15208)](#_Toc15208)

[5.2 系统集成测试 [32](#_Toc4355)](#_Toc4355)

[5.3 性能测试 [33](#_Toc24929)](#_Toc24929)

[5.4 测试总结 [33](#_Toc29104)](#_Toc29104)

[**6 总结与展望 [33](#_Toc3091)**](#_Toc3091)

[6.1 论文工作总结 [33](#_Toc23671)](#_Toc23671)

[6.2 存在问题与改进方向 [34](#_Toc19050)](#_Toc19050)

[6.3 对未来展望 [34](#_Toc10387)](#_Toc10387)

[**参考文献 [35](#_Toc21258)**](#_Toc21258)

[**致谢**](#_Toc3566) **36**

**基于React古籍收藏系统的设计与实现**

<span id="_Toc7548" class="anchor"></span>**1 绪论**

<span id="_Toc7410" class="anchor"></span>**1.1 研究背景和意义**

古籍即古代典籍，是历史上流传下来的、具有一定历史价值和研究价值的书籍和文献资料。古籍中记录了语言、历史、哲学、文学、地理、人文和科学等多方面知识，是中华优秀传统文化的物质载体，是其智慧和结晶。2007年，国务院办公厅发布《关于进一步加强古籍保护工作的意见》，标志着“中华古籍保护计划”的正式启动<sup>\[1\]</sup>。2014年，习总书记提出“让收藏在博物馆里的文物、陈列在广阔大地上的遗产、书写在古籍里的文字都活起来<sup>\[2\]</sup>”，为文化工作者提出了工作方向，推进古籍利用和文化传播<sup>\[3\]</sup>。2017年，文化部印发《“十三五”使其全国古籍保护工作规划》，提出“加强古籍数据化工作”，接住云服务等高新技术，建立古籍数字资源库，促进古籍资源的开放利用，同时提出“坚持合理利用”，推动多种方式的发展，发挥古籍的文化价值和社会服务功能<sup>\[4\]</sup>。2022年4月，中共中央办公厅、国务院办公厅印发《关于推进新时代古籍工作的意见》，明确提出“鼓励社会各界积极参与古籍事业”<sup>\[5\]</sup>。由此可以看出，国家十分关注古籍保护且注重古籍数字化的发展，期望通过加强古籍数字化建设，提高古籍保护效率，拓宽古籍保护的社会化参与程度，为古籍的保护提供了强有力的政策支持，同时也为古籍数字化平台建设提供了完善的方针政策。

近年来，互联网技术的不断发展促进了信息资源的加速传播，电子书、电子阅读器、网络小说等新兴书籍形式层出不穷，打破了之前时间和空间对阅读的阻碍，开放共享的阅读形式也为古籍的数字化和古籍保护提供了传播空间，公众对于古籍数字化的认知也逐渐提高，使越来越多的社会化主体主动参与到古籍数字化保护中来，有利于更好推进古籍数字化保护工作。

目前古籍数字化研究虽有了长远的发展，却也存在不足。其一，现阶段的古籍数字化研究存在理论与实践的不平衡，具体实践相对欠缺。其二，多局限于图书馆学、档案学和博物馆学的古籍文献整理研究，缺少和计算机技术等相关学科的跨学科融合。其三，古籍保护的社会化主体参与度较低<sup>\[5\]</sup>。传统的古籍数字化平台多以古籍收藏和数字化保护为主要任务，保护门槛较高，缺少与公众之间的交流，社会参与程度低，使有意愿社会化主体无法较好的参与到古籍保护工作中。由于古籍保护的门槛较高和社会参与化程度较低也使古籍保护多以经典著作为主，缺少对民间古籍和小众古籍的收集和保护。同时也使社会化主体之间关于古籍保护的交流也较为缺乏。

<span id="_Toc16247" class="anchor"></span>**1.2 国内外研究现状**

**1.2.1 关于React技术的研究现状**

React是由facebook推出的前端框架，无论是在国内市场还是国际市场都展现出了强大的生命力和广泛的应用前景。在国内，关于React技术的研究多基于React的前端框架进行系统设计、软件开发和前端组件的展示。如黄雅琴利用React框架实现文档系统的设计<sup>\[6\]</sup>、李晓纯等采用React框架设计开发了在线教学平台<sup>\[7\]</sup>、张郑宇强基于React技术实现马拉松竞赛数据可视化平台<sup>\[8\]</sup>等。在国外，React的相关文献也多为基于其框架进行系统设计，但也包含其他交叉领域的研究。如React技术的商业应用价值与其优势<sup>\[9\]</sup>、与其他技术的比较研究和React技术的相关实现<sup>\[10\]</sup>。

**1.2.2 关于古籍数字化的研究现状**

国内与国外在古籍数字化方面的研究均始于20世纪80年代中期，并在当前得到了广泛发展<sup>\[11\]</sup>。国内主要集中在古籍修复、数字化处理和数字化图书馆、博物馆建设方面，如中国海洋大学的藏书印<sup>\[12\]</sup>、籍合网<sup>\[13\]</sup>等。研究机构乃至国家投入大量资金和精力在保护、整理、修复和存储古籍，旨在传承我国的优秀历史文化遗产。在国外，研究多集中在光学字符识别（OCR）、3D图像收集分割、卷神经网络和文本复原等方面<sup>\[11\]</sup>。同时，在关于古籍善本的电子保存方面提出了其优点和可借鉴案例<sup>\[14\]</sup>。

**1.2.3 关于React技术在古籍收藏中的应用研究现状**

目前，国内与国外应用React技术实现古籍收藏方面的研究相对较新，在国内和国外均较少使用React技术进行古籍的数据化处理。但在文件管理系统和图书管理系统等相似领域有着一定的应用，为其在古籍收藏中的应用提供借鉴意义。随着React技术的普及和数字化古籍的展示需求，React技术在古籍数字化的应用研究会逐渐增加，结合React动态性为用户提供更为丰富的体验。

<span id="_Toc3346" class="anchor"></span>**1.3 研究内容与目标**

可以发现，关于React技术在古籍收藏中的应用国内外学者研究均处于探索阶段，但已经展现出了一定的潜力和创新方向。其一，用户界面的创新，其二，交互性增强，其三，跨学科间的交互，其四，社会化参与程度的提高。基于以上不足，本系统首先利用React组件化特性使用户界面设计更加灵活美观，让用户获得更好的页面浏览、社会化交流和古籍上传和阅读体验。其次利用React技术的事件处理和状态管理功能，开发出高度交互式的古籍展示与交流平台，更好的实现用户讨论，促进用户之间的交流和古籍信息的上传、存储、下载、管理，进一步推动古籍数字化保护和古籍文化的交流与传播。再者使古籍保护与计算机技术进行跨学科交互的实践成为可能。基于React技术实现一个古籍收藏系统平台，将传统古籍和现代计算机技术相结合，提高在古籍收藏领域的数字化程度。最后通过系统中的交流区和古籍收藏功能给社会化主体提供了一个开放共享的古籍交流平台，提高了社会化主体的参与度。

<span id="_Toc5883" class="anchor"></span>**2 需求分析**

<span id="_Toc17671" class="anchor"></span>**2.1 系统功能需求**

**2.1.1 用户管理模块**

用户方面，支持新用户注册、系统登录、安全退出以及个人信息维护。同时，点击古籍相关分类时会显示相关分类古籍信息，满足用户个性化需求。再者，用户可上传自己的古籍信息，实时查看上传古籍的详细信息，更改和删除所上传的古籍信息。此外，还可以实现学术动态信息和相关数字图书馆与博物馆的浏览，随时掌握学术动态和古籍数字化信息。最后用户可以通过交流区和古籍详情页的评论区与其他用户互动交流。

管理员具备完整的账户管理权限，可对用户账户执行检索和注销操作，同时能够对其他管理员进行添加、注销、检索及信息修改等操作。此外管理员还具备完整的古籍信息管理权限，包括新增、编辑、查询与删除等操作，确保古籍数据准确。还可以实现对前台用户页面的背景图片、学术动态信息进行管理，保证图片和信息的及时替换更新。最后实现交流区添加评论和对用户评论信息进行回复、删除。

**2.1.2 背景图管理模块**

背景图管理主要对首页、资源集和学术导航三个页面的背景图进行管理，管理员可以实现对其三个页面的背景图片进行替换、删除、添加和查看大图等操作，使前台用户页面的背景图片可以不定时更新增强用户的体验感。

**2.1.3 古籍上传模块**

古籍上传模块是系统的核心之一，主要实现用户和管理员对古籍信息、古籍图片和古籍文件的上传，并且能够准确判断出该古籍是由哪位用户或者管理员上传，提高对古籍信息的管理效率。

**2.1.4 古籍管理模块**

古籍管理模块是系统的关键部分，管理员可以查看数据库中所有古籍信息，并且可以实现古籍信息的分类展示、修改、删除和查询，以便对古籍信息进行精准管理。

**2.1.5 学术动态管理模块**

学术动态管理模块主要用于管理员对学术动态展览信息的编辑，包括展览信息的添加、搜索、编辑和删除。实现对前台用户页面学术展览信息的及时更新，提高用户体验。

**2.1.6 交流区管理模块**

交流区模块是系统的核心之一，主要实现管理员对评论信息的回复、添加和删除，加强与用户之间的交流，同时保证评论言论的正确性为平台营造一个良好的网络环境。

**2.1.7 个人信息中心模块**

个人信息中心模块主要分为我的评论、我的上传、上传古籍、账号与安全四个页面。我的评论页面，用户可以查看自己发表过的评论，并支持删除操作。我的上传页面，用户可查阅本人已上传的全部古籍信息，并支持对文献数据进行编辑、删除等管理操作。上传古籍页面，用户可以在此页面实现古籍信息上传。账号与安全页面用户则可以在此页面查看用户基本信息，实现对用户信息的更改和退出登录操作。

**2.1.8 古籍分类与展示模块**

古籍分类与展示模块是前台用户页面实现古籍信息的前端展示、点击分类进入显示相关分类古籍信息，点击古籍显示古籍的详细信息，点击下载实现古籍文件的下载与保存，并且可以在不同古籍下进行评论和与其他用户进行交流，提高古籍数字化的社会化参与度。

**2.1.9 资讯模块**

资讯模块分为学术动态页面和学术导航页面，用户可以在前台系统的学术动态页面查看最新学术动态信息，了解古籍展览的最新情况，而在学术导航页面可以点击古籍图书馆、数字博物馆和美术馆的相关跳转链接实现各类数字馆的页面跳转。

**2.1.10 用户评论模块**

用户评论模块是用户可以在交流区进行交流与评论，探讨有关古籍的知识，方便找到志同道合的朋友，并且可以在相关古籍下进行评论，使用户之间的交流更为精准。

<span id="_Toc22714" class="anchor"></span>**2.2 非功能需求**

除功能需求外，系统还需要考虑非功能需求。这些需求关注系统的特征和质量，这些特征和质量有助于系统的整体性能、可用性、安全性、可靠性和可维护性<sup>\[15\]</sup>。古籍收藏系统的非功能需求包括性能、系统权限、安全性等，在信息系统的开发中，非功能性需求是非常重要的<sup>\[16\]</sup>。

在性能方面，需保证高效的响应能力，并能同时满足多用户需求。在系统权限方面，古籍收藏系统是一个具有不确定访问量和用户的系统。系统需要权限分离机制，区分管理员和用户的操作权限，并在登录时实现严格的身份认证。在安全性方面，系统仅允许用户访问敏感数据和功能，并对其重要数据进行加密存储，以保障数据安全。

<span id="_Toc4497" class="anchor"></span>**2.3 系统用例图**

**2.3.1 管理员用例图**

管理员对整个系统进行维护和管理，具体包含用户信息管理、管理员信息管理、古籍上传管理、古籍信息管理、背景图管理、学术动态管理和交流区管理。如图2-1所示。

<figure>
<img src="media/image2.png" style="width:5.27153in;height:2.30625in"
alt="管理员用例图" />
<figcaption><p>图 2-1 管理员用例图</p></figcaption>
</figure>

**2.3.2 用户用例图**

用户注册登录后进入系统可以实现古籍信息分类检索、上传古籍、查看学术动态信息、查看学术导航信息、查看评论信息、进行评论、删除评论、查看我的上传、删除我的上传、修改我的上传、查看账号信息、修改账号信息、退出登录等，如图2-2所示。

<figure>
<img src="media/image3.png" style="width:5.05in;height:2.09097in"
alt="用户用例图" />
<figcaption><p>图 2-2 用户用例图</p></figcaption>
</figure>

**2.3.3 背景图用例图**

管理员可对首页、资源集、学术导航三个页面的图片进行添加、替换和删除，如图2-3所示。

<figure>
<img src="media/image4.png" style="width:5.23681in;height:2.31389in"
alt="轮播图用例图" />
<figcaption><p>图 2-3 背景图例图</p></figcaption>
</figure>

**2.3.4 学术动态用例图**

管理员可以对学术动态的信息进行增加、修改和删除，用户可以在前台学术动态页面实时查看学术动态信息，如图2-4所示。

<figure>
<img src="media/image5.png" style="width:5.17361in;height:2.22569in"
alt="学术动态用例图" />
<figcaption><p>图 2-4 学术动态用例图</p></figcaption>
</figure>

**2.3.5 交流区用例图**

在交流区，管理员支持发布新话题并对用户评论进行回复及删除管理。普通用户享有评论发布、自主删除及互动回复的操作权限，相关功能界面布局详见图2-5。

<figure>
<img src="media/image6.png" style="width:5.3125in;height:3.26528in"
alt="交流区用例图" />
<figcaption><p>图 2-5 交流区用例图</p></figcaption>
</figure>

**2.3.6 古籍上传用例图**

古籍上传权限对管理员和用户共同开放，用户仅能对本人提交的内容进行修改和删除，管理员则可对所有古籍信息进行删除、修改和检索操作。如图2-6所示。

<figure>
<img src="media/image7.png" style="width:5.42778in;height:1.93611in"
alt="古籍上传用例图" />
<figcaption><p>图 2-6 古籍上传用例图</p></figcaption>
</figure>

<span id="_Toc29892" class="anchor"></span>**3 系统设计**

<span id="_Toc1253" class="anchor"></span>**3.1 系统总体框架设计**

古籍收藏管理系统采用Mysql数据库技术、Express后端框架和React框架对系统进行设计，实现古籍信息的浏览、上传、下载、分类检索、用户管理、古籍评论、交流区评论与管理和权限控制等功能，支持不同角色执行相应操作。本系统采用三层架构框架，表示层采用React技术配合Ant
Design组件库，负责用户界面的可视化呈现和交互操作。业务逻辑层基于Express框架处理前端请求，使用JWT解析前端Token实现身份验证、权限控制和数据处理等核心业务逻辑。数据存储层依托Mysql数据库实现，对古籍信息、用户数据和评论数据等进行存储管理。系统架构如图3-1所示，系统功能架构如图3-2所示。

<figure>
<img src="media/image8.png" style="width:5.36875in;height:3.71042in"
alt="Snipaste_2025-04-05_20-35-03" />
<figcaption><p>图 3-1 古籍收藏系统架构图</p></figcaption>
</figure>

<img src="media/image9.png" style="width:5.27639in;height:3.41875in"
alt="系统功能架构图" />

图 3-2 古籍收藏系统功能架构图

<span id="_Toc14242" class="anchor"></span>**3.2
前端框架与后端逻辑设计**

古籍收藏管理系统前端动态生成HTML并与后端API进行交互，前端利用React的组件化开发提高代码的重复性和可维护性，并且使用React
Router实现页面跳转，Axios负责API请求，Token机制保障数据安全性。后端采用Express框架搭建RESTful
API服务负责业务逻辑处理，使用JWT和密码加密实现用户认证，Multer实现古籍文件和图片上传。如图3-3所示。

<figure>
<img src="media/image10.png" style="width:5.7625in;height:4.00556in"
alt="前后端交互" />
<figcaption><p>图 3-3 古籍收藏系统前后端交互图</p></figcaption>
</figure>

<span id="_Toc12433" class="anchor"></span>**3.3 数据库设计**

**3.3.1 数据库表结构设计**

完整数据库的设计，古籍收藏系统的数据表如下所示：

1、用户信息表

用户信息表包括id、用户名、密码、邮箱、角色，如表3-1所示。

表3-1 用户信息表

|          |          |               |                  |      |
|:--------:|:--------:|:-------------:|:----------------:|:----:|
| 英文字段 | 数据类型 |     长度      |       约束       | 备注 |
|    id    |   Char   |      36       |     NOT NULL     | 主键 |
| username | Varchar  |      255      | NOT NULL、UNIQUE |      |
| password | Varchar  |      255      |     NOT NULL     |      |
|  email   | Varchar  |      100      |      UNIQUE      | NULL |
|   role   |   Enum   | ‘user’‘admin’ |     NOT NULL     |      |

2、资源集背景图表

资源集背景图表包括id、图片路径、上传时间，如表3-2所示。

表3-2 资源集背景图表

|             |           |      |          |                   |
|:-----------:|:---------:|:----:|:--------:|:-----------------:|
|  英文字段   | 数据类型  | 长度 |   约束   |       备注        |
|     id      |   Char    |  36  | NOT NULL |       主键        |
| image_path  |  Varchar  | 255  | NOT NULL |                   |
| upload_time | TimeStamp |      |          | CURRENT_TIMESTAMP |

3、首页背景图表

首页背景图表包括id、图片路径、上传时间，如表3-3所示。

表3-3 首页背景图表

|             |           |      |          |                   |
|:-----------:|:---------:|:----:|:--------:|:-----------------:|
|  英文字段   | 数据类型  | 长度 |   约束   |       备注        |
|     id      |   Char    |  36  | NOT NULL |       主键        |
| image_path  |  Varchar  | 255  | NOT NULL |                   |
| upload_time | TimeStamp |      |          | CURRENT_TIMESTAMP |

4、学术导航背景图表

学术导航背景图表包括id、图片路径、上传时间，如表3-4所示。

表3-4 学术导航背景图表

|             |           |      |          |                   |
|:-----------:|:---------:|:----:|:--------:|:-----------------:|
|  英文字段   | 数据类型  | 长度 |   约束   |       备注        |
|     id      |   Char    |  36  | NOT NULL |       主键        |
| image_path  |  Varchar  | 255  | NOT NULL |                   |
| upload_time | TimeStamp |      |          | CURRENT_TIMESTAMP |

5、学术动态表

学术动态表包括id、学术动态图片、学术动态名称、学术动态内容、学术动态上传时间，如表3-1所示。

表3-5 学术动态表

|               |           |      |          |                   |
|:-------------:|:---------:|:----:|:--------:|:-----------------:|
|   英文字段    | 数据类型  | 长度 |   约束   |       备注        |
|      id       |   Char    |  36  | NOT NULL |       主键        |
|  event_image  |  Varchar  | 255  | NOT NULL |                   |
|  event_title  |  Varchar  | 255  | NOT NULL |                   |
| event_content |   Text    |      | NOT NULL |                   |
|  event_time   | TimeStamp |      | NOT NULL | CURRENT_TIMESTAMP |

6、古籍信息表

古籍信息表包括book_id、古籍名称、传统分类、特殊分类、现代分类、朝代、作者、古籍简介、刊印信息、行款版式、序文信息、钤印信息、收藏来源、目录、上传文件、上传文件、上传图片，如表3-6所示。

表3-6 古籍信息表

|                      |           |      |          |                   |
|:--------------------:|:---------:|:----:|:--------:|:-----------------:|
|       英文字段       | 数据类型  | 长度 |   约束   |       备注        |
|       book_id        |   Char    |  36  | NOT NULL |       主键        |
|      book_name       |  Varchar  | 255  | NOT NULL |                   |
| traditional_category |   Enum    |      |          |       NULL        |
|   special_category   |   Enum    |      |          |       NULL        |
|   modern_category    |   Enum    |      |          |       NULL        |
|       dynasty        |   Enum    |      | NOT NULL |                   |
|        author        |  Varchar  | 255  |          |       NULL        |
|   book_description   |   Text    |      |          |       NULL        |
|    printing_info     |   Text    |      |          |       NULL        |
|     layout_style     |   Text    |      |          |       NULL        |
|     preface_info     |   Text    |      |          |       NULL        |
|      seal_info       |   Text    |      |          |       NULL        |
|  collection_source   |   Text    |      |          |       NULL        |
|      directory       |   Text    |      |          |       NULL        |
|     book_images      |  Varchar  | 255  |          |       NULL        |
|  file_download_link  |  Varchar  | 255  |          |       NULL        |
|    upload_user_id    |   Char    |  36  |          |    外键、NULL     |
|     upload_time      | TimeStamp |      |          | CURRENT_TIMESTAMP |

7、评论表

评论表包括评论id、用户id、古籍id、内评论id、评论内容、评论时间、评论类型，如表3-7所示。

表3-7 评论表

|                   |           |               |          |                   |
|:-----------------:|:---------:|:-------------:|:--------:|:-----------------:|
|     英文字段      | 数据类型  |     长度      |   约束   |       备注        |
|    comment_id     |   Char    |      36       | NOT NULL |       主键        |
|      user_id      |   Char    |      36       | NOT NULL |       外键        |
|      book_id      |   Char    |      36       | NOT NULL |       外键        |
| parent_comment_id |   Char    |      36       | NOT NULL |                   |
|      content      |   Text    |               | NOT NULL |                   |
|   comment_time    | TimeStamp |               | NOT NULL | CURRENT_TIMESTAMP |
|   comment_type    |   Enum    | ‘book’,‘talk’ |          |                   |

**3.3.2 数据库关联图**

数据库设计是对数据进行组织化和结构化的过程<sup>\[17\]</sup>。数据库架构通过实体关系模型实现可视化呈现，完整映射数据间的逻辑关联。本系统关联图明确展示用户实体、管理员角色、古籍详细信息及交互评论数据的关系网络。用户具备古籍分类检索、古籍信息上传及评论交互功能，管理员则可实现古籍信息管理、用户信息管理、背景图替换、学术动态更新和评论等操作。如图3-4所示。

<figure>
<img src="media/image11.png" style="width:4.87222in;height:3.84097in"
alt="E-R2" />
<figcaption><p>图 3-4 数据库关联图</p></figcaption>
</figure>

<span id="_Toc20221" class="anchor"></span>**4 系统功能模块实现**

<span id="_Toc10265" class="anchor"></span>**4.1 登录与注册模块的实现**

**4.1.1 用户注册流程**

用户注册模块，要求用户提供用户名、密码和邮箱信息，成功创建账户后即可登录古籍收藏系统。前端获取用户输入的注册信息调用onFinish方法将用户信息和token传输到后端调用register实现注册逻辑，检查输入的用户名和邮箱是否重复，如是新用户则插入用户数据，注册成功后，用户可以登录进入古籍收藏系统主页面。用户注册界面如图4-1所示，时序图如图4-2所示，流程图如4-3所示。

<figure>
<img src="media/image12.png" style="width:5.40139in;height:2.73264in"
alt="用户注册页面" />
<figcaption><p>图 4-1 用户注册页面</p></figcaption>
</figure>

<figure>
<img src="media/image13.png" style="width:5.27917in;height:4.55069in"
alt="用户注册时序图" />
<figcaption><p>图 4-2 用户注册时序图</p></figcaption>
</figure>

<figure>
<img src="media/image14.png" style="width:5.64028in;height:4.23611in"
alt="用户注册流程图" />
<figcaption><p>图 4-3 用户注册流程图</p></figcaption>
</figure>

**4.1.2 登录与权限认证**

用户登录模块，用户需输入用户名和密码进行身份验证，验证成功后才能进入古籍收藏系统主页面，若验证失败则提示错误信息并无法访问古籍收藏系统。前端获取用户输入的登录信息调用onFinish方法将用户信息和token传输到后端调用login实现登录逻辑，检查输入的用户名和密码是否正确，如不正确则弹出错误提示，登录成功后，用户可以登录进入古籍收藏系统主页面。用户登录界面如图4-4所示，主界面如图4-5所示，时序图如4-6所示。

<figure>
<img src="media/image15.png" style="width:5.52708in;height:2.79583in"
alt="用户登录页面" />
<figcaption><p>图 4-4 用户登录页面</p></figcaption>
</figure>

<figure>
<img src="media/image16.png" style="width:5.65833in;height:2.91319in"
alt="首页图片2" />
<figcaption><p>图 4-5 首页页面</p></figcaption>
</figure>

<figure>
<img src="media/image17.png" style="width:5.43264in;height:4.70972in"
alt="登录时序图" />
<figcaption><p>图 4-6 用户登录时序图</p></figcaption>
</figure>

<span id="_Toc21572" class="anchor"></span>**4.2 古籍上传模块的实现**

古籍上传模块是系统的核心功能。主要是古籍信息输入和上传，如古籍名称、古籍内容、古籍所属分类、古籍照片、古籍文件。用户和管理员可以输入相关古籍信息，提交成功后古籍信息成功插入数据库。前端获取用户和管理员输入的古籍信息调用onFinish方法将古籍信息和token传输到后端调用ancientBooks实现古籍信息上传逻辑并且判断由哪位用户或管理员上传，上传成功或失败均会弹出提示信息。用户的古籍上传界面如图4-7所示，管理员古籍上传界面如图4-8所示，时序图如4-9所示。

<figure>
<img src="media/image18.png" style="width:5.70764in;height:2.92292in"
alt="用户上传古籍" />
<figcaption><p>图 4-7 用户古籍上传页面</p></figcaption>
</figure>

<figure>
<img src="media/image19.png" style="width:5.76667in;height:2.95278in"
alt="管理员古籍上传" />
<figcaption><p>图 4-8 管理员古籍上传页面</p></figcaption>
</figure>

<figure>
<img src="media/image20.png" style="width:5.27778in;height:4.12778in"
alt="上传古籍时序图" />
<figcaption><p>图 4-9 古籍上传时序图</p></figcaption>
</figure>

<span id="_Toc17039" class="anchor"></span>**4.3 古籍管理模块的实现**

古籍管理模块是系统的关键功能。系统为管理员提供古籍信息管理功能，管理员可以修改、查询和删除古籍信息。前端获取管理员对古籍信息的操作调用onFinish方法对古籍的操作传输到后端调用ancientManage实现其功能，修改和删除成功或失败均会弹出提示信息。古籍管理界面如图4-10所示，时序图如4-11所示。

<figure>
<img src="media/image21.png" style="width:5.76667in;height:2.95139in"
alt="古籍管理页面" />
<figcaption><p>图 4-10 古籍管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image22.png" style="width:5.7125in;height:4.34444in"
alt="古籍管理时序图" />
<figcaption><p>图 4-11 古籍管理时序图</p></figcaption>
</figure>

<span id="_Toc19083" class="anchor"></span>**4.4
古籍分类与展示模块的实现**

用户页面的古籍分类与展示模块，用户可以在点击不同古籍分类时则会显示相应分类的古籍信息，点击相关古籍后显示该古籍的详细信息。古籍界面如图4-12、4-13、4-14、4-15所示。

<figure>
<img src="media/image23.png" style="width:5.74097in;height:2.93125in"
alt="古籍页面3" />
<figcaption><p>图 4-12 古籍分类页面</p></figcaption>
</figure>

<figure>
<img src="media/image24.png" style="width:5.49236in;height:2.82569in"
alt="古籍页面4" />
<figcaption><p>图 4-13 古籍分类页面</p></figcaption>
</figure>

<figure>
<img src="media/image25.png" style="width:5.56597in;height:2.84167in"
alt="古籍页面6" />
<figcaption><p>图 4-14 古籍分类页面</p></figcaption>
</figure>

<figure>
<img src="media/image26.jpeg" style="width:5.75972in;height:7.67986in"
alt="微信图片_20250402034014" />
<figcaption><p>图 4-15 古籍详情页面</p></figcaption>
</figure>

<span id="_Toc19164" class="anchor"></span>**4.5 用户管理模块的实现**

用户管理模块，管理员拥有双重权限，既可对管理员信息进行检索、添加、修改和注销操作，又可对普通用户信息进行检索和注销操作。前端获取管理员对用户和管理员信息相关操作调用fetchUsers方法对用户信息进行操作并传输到后端调用user实现其功能。用户管理界面如图4-16所示，管理员界面如图4-17、4-18所示，时序图如4-19所示。

<figure>
<img src="media/image27.png" style="width:5.48611in;height:2.80417in"
alt="用户管理页面" />
<figcaption><p>图 4-16 用户管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image28.png" style="width:5.45417in;height:2.79861in"
alt="管理员管理页面" />
<figcaption><p>图 4-17 管理员管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image29.png" style="width:5.75972in;height:2.91319in"
alt="管理员页面" />
<figcaption><p>图 4-18 管理员管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image30.png" style="width:5.35417in;height:2.90903in"
alt="用户管理时序图" />
<figcaption><p>图 4-19 用户管理时序图</p></figcaption>
</figure>

<span id="_Toc13936" class="anchor"></span>**4.6 背景图管理模块的实现**

背景图管理模块，管理员可对用户前台页面的首页、资源集和学术动态的背景图进行更新、删除、上传和预览等操作。前端获取管理员对背景图的相关操作调用fetchCarouselImages方法对背景图进行操作并传输到后端调用ancademicimage实现其功能。背景管理如图4-20所示，时序图如4-21所示。

<figure>
<img src="media/image31.png" style="width:5.76319in;height:2.95139in"
alt="轮播图页面" />
<figcaption><p>图 4-20 背景图管理页面<img src="media/image32.png"
style="width:5.76111in;height:3.57986in"
alt="轮播图时序图" /></p></figcaption>
</figure>

图 4-21 背景图管理序图

<span id="_Toc31371" class="anchor"></span>**4.7 资讯模块的实现**

资讯模块，用户可以在前端页面点击学术导航和学术动态查看最新古籍展览信息和数字化展馆链接。学术动态信息可以由管理员进行创建、更新、检索和删除等基本操作。前端获取管理员对学术动态信息的相关操作调用LearnList方法对学术动态进行相关操作并传输到后端调用learntrend实现其功能。学术导航界面如图4-22所示，学术动态界面如图4-23所示，学术动态管理界面如图4-24所示，时序图如4-25所示。

<figure>
<img src="media/image33.png" style="width:5.30139in;height:2.71667in"
alt="学术导航" />
<figcaption><p>图 4-22 学术导航页面</p></figcaption>
</figure>

<figure>
<img src="media/image34.png" style="width:5.47569in;height:2.8125in"
alt="用户学术动态" />
<figcaption><p>图 4-23 学术动态页面</p></figcaption>
</figure>

<figure>
<img src="media/image35.png" style="width:5.76319in;height:2.95139in"
alt="学术动态管理" />
<figcaption><p>图 4-24 学术动态管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image36.png" style="width:5.76597in;height:4.50972in"
alt="学术动态时序图" />
<figcaption><p>图 4-25 学术动态时序图</p></figcaption>
</figure>

<span id="_Toc9135" class="anchor"></span>**4.8 交流区模块的实现**

交流区模块，管理员可以对评论信息进行删除、添加和回复操作，用户可以在交流区发表评论、回复其他用户评论。前端获取管理员对交流区信息相关操作调用fetchAllComments方法对交流区信息进行操作并传输到后端调用comments实现对交流区信息的评论、回复和删除。前端获取用户评论操作调用fetchComments方法对评论信息进行操作并传输到后端调用comments实现评论和回复，用户交流区界面如图4-26所示，交流区管理界面如图4-27所示，时序图如4-28所示。

<figure>
<img src="media/image37.png" style="width:5.75694in;height:2.875in"
alt="交流区页面" />
<figcaption><p>图 4-26 交流区页面</p></figcaption>
</figure>

<figure>
<img src="media/image38.png" style="width:5.76667in;height:2.95139in"
alt="交流区管理页面" />
<figcaption><p>图 4-27 交流区管理页面</p></figcaption>
</figure>

<figure>
<img src="media/image39.png" style="width:5.22361in;height:3.98611in"
alt="交流区时序图" />
<figcaption><p>图 4-28 交流区时序图<span id="_Toc17871"
class="anchor"></span></p></figcaption>
</figure>

**4.9 个人信息中心模块的实现**

**4.9.1 我的评论**

我的评论页面，用户可以查阅本人发布的全部评论记录，并具备删除权限。前端获取用户评论信息和相关操作调用fetchUserComments方法对评论信息进行操作并传输到后端调用comments实现评论的删除，我的评论界面如图4-29所示。

<figure>
<img src="media/image40.png" style="width:5.76319in;height:2.95833in"
alt="我的评论界面" />
<figcaption><p>图 4-29 我的评论界面</p></figcaption>
</figure>

**4.9.2 我的古籍**

我的古籍页面，点击进入页面后显示该用户所上传的古籍，并且可以对所上传的古籍进行删除和编辑操作。前端获取用户对所上传古籍信息和相关操作调用UploadHistory方法对所上传的古籍信息进行操作并传输到后端调用userBooks实现用户对所上传古籍的操作，我的古籍界面如图4-30、4-31所示，时序图如4-32所示。

<figure>
<img src="media/image41.png" style="width:5.35764in;height:2.73889in"
alt="我的上传" />
<figcaption><p>图 4-30 我的古籍页面</p></figcaption>
</figure>

<figure>
<img src="media/image42.png" style="width:5.27153in;height:2.70903in"
alt="我的上传2" />
<figcaption><p>图 4-31 我的古籍编辑页面</p></figcaption>
</figure>

<figure>
<img src="media/image43.png" style="width:5.17292in;height:4.79306in"
alt="我的上传时序图" />
<figcaption><p>图 4-32 我的古籍时序图</p></figcaption>
</figure>

**4.9.3 账号与安全**

账号与安全页面，点击进入页面后显示该用户的详细信息如用户名、密码和邮箱，并且可以对用信息进行修改和退出登录操作。前端获取用户信息和相关操作调用Consumer方法对用户信息进行修改并传输到后端调用consumerc实现相关操作，账号与安全界面如图4-33所示，时序图如4-34所示。

<figure>
<img src="media/image44.png" style="width:5.34306in;height:2.74167in"
alt="账号与安全1" />
<figcaption><p>图 4-33 账号与安全页面</p></figcaption>
</figure>

<figure>
<img src="media/image45.png" style="width:5.4875in;height:4.16944in"
alt="账号与安全时序图" />
<figcaption><p>图 4-34 账号与安全时序图</p></figcaption>
</figure>

<span id="_Toc7573" class="anchor"></span>**5 系统测试与评估**

软件测试在软件开发的整个周期中是关键环节，需要对整个系统进行测试，以确保系统可以依照预期正常运行<sup>\[18\]</sup>。在古籍收藏系统中主要对每个系统功能模块设计测试程序进行系统测试，确保每个功能均可顺利使用。此外，为保证用户在使用古籍收藏系统时获得良好体验，还进行了功能测试和性能测试。

<span id="_Toc15208" class="anchor"></span>**5.1 系统模块测试**

系统模块测试的核心目的是验证各功能模块是否符合设计要求，通过对系统各功能模块编写测试用例并实施测试，来验证其是否达到设计目标。如表5-1呈现了部分系统模块的功能测试情况。

表 5-1部分系统模块测试表

<table>
<colgroup>
<col style="width: 17%" />
<col style="width: 17%" />
<col style="width: 34%" />
<col style="width: 18%" />
<col style="width: 12%" />
</colgroup>
<tbody>
<tr>
<td>测试用例</td>
<td>目的</td>
<td>步骤</td>
<td>预期结果</td>
<td>实际结果</td>
</tr>
<tr>
<td>上传古籍信息</td>
<td>验证系统能够正确上传古籍信息</td>
<td><p>1.通过Postman向添加古籍API发送一个包含有效古籍信息的POST请求</p>
<p>2.确认返回状态码为200（成功状态）</p>
<p>3.查询数据库记录，核实古籍信息是否精准入库</p></td>
<td>该古籍信息已成功写入数据库</td>
<td>通过</td>
</tr>
<tr>
<td>修改古籍信息</td>
<td>保证系统能准确执行对古籍信息的修改功能</td>
<td><p>1.首先添加一个测试古籍信息</p>
<p>2.使用Postman提交古籍信息修改的PUT请求</p>
<p>3.确认返回状态码为200（成功状态）</p>
<p>4.执行数据库查询操作以验证古籍信息的修改状态</p></td>
<td>该古籍信息在数据库中已更新</td>
<td>通过</td>
</tr>
<tr>
<td>删除古籍信息</td>
<td>保证系统能准确执行对古籍信息的删除操作</td>
<td><p>1.首先添加一个测试古籍信息</p>
<p>2.使用Postman发送删除古籍信息的PUT请求。</p>
<p>3.确认返回状态码为200（成功状态）</p>
<p>4.执行数据库查询操作以验证古籍信息的删除状态</p></td>
<td>该古籍数据在数据库中成功删除</td>
<td>通过</td>
</tr>
<tr>
<td>添加评论信息</td>
<td>确保系统具备正确处理评论信息的添加操作</td>
<td><p>1.通过Postman向添加评论的API发送一个包含有效评论信息的POST请求</p>
<p>2.确认返回状态码为200（成功状态）</p>
<p>3.执行数据库查询操作核实评论数据的添加状态</p></td>
<td>该评论数据已被成功存储至数据库中</td>
<td>通过</td>
</tr>
</tbody>
</table>

<span id="_Toc4355" class="anchor"></span>**5.2 系统集成测试**

集成测试主要测试系统的多个模块如何协作，确保各功能模块能够协调运行，优化终端用户的交互体验。部分集成用例如表5-2所示。

表5-2集成用例表

<table style="width:100%;">
<colgroup>
<col style="width: 17%" />
<col style="width: 17%" />
<col style="width: 34%" />
<col style="width: 18%" />
<col style="width: 12%" />
</colgroup>
<tbody>
<tr>
<td>测试用例</td>
<td>目的</td>
<td>步骤</td>
<td>预期结果</td>
<td>实际结果</td>
</tr>
<tr>
<td>用户权限验证</td>
<td>确保系统具有完善的权限管理功能</td>
<td><p>1.使用不同权限的账户登录系统。</p>
<p>2.尝试访问受限功能或数据。</p>
<p>3.检查系统是否正确执行了权限控制。</p></td>
<td>系统依照用户权限，正确判断并执行了相应访问</td>
<td>通过</td>
</tr>
<tr>
<td>动态数据管理</td>
<td>确保前台数据可以实时更新</td>
<td><ol type="1">
<li><p>管理员对相关功能信息进行修改</p></li>
<li><p>用户登录前台系统后可以看到管理员更改后的信息</p></li>
</ol></td>
<td>用户可以看到实时更新后的信息</td>
<td>通过</td>
</tr>
</tbody>
</table>

<span id="_Toc24929" class="anchor"></span>**5.3 性能测试**

古籍收藏系统的性能测试主要考察并发处理能力，验证多用户同时登录和操作时系统的稳定性，避免系统性能下降或服务中断，测试内容包括多用户登录状态验证及登录后的功能操作流畅性。测试数据如图5-1所示。

<figure>
<img src="media/image46.png" style="width:5.76528in;height:1.75347in"
alt="Snipaste_2025-04-02_05-33-04" />
<figcaption><p>图 5-1 性能测试图</p></figcaption>
</figure>

<span id="_Toc29104" class="anchor"></span>**5.4 测试总结**

系统测试是系统开发的重要组成部分<sup>\[19\]</sup>。古籍收藏系统通过模块测试、集成测试和性能测试，运行稳定无重大问题，系统的可靠性得到有效认证，为系统的实际使用提供了一定保障。

<span id="_Toc3091" class="anchor"></span>**6 总结与展望**

<span id="_Toc23671" class="anchor"></span>**6.1 论文工作总结**

古籍收藏系统旨在保存古籍的完整性，将古籍图书数字化，以供读者进行查阅，对于发挥古籍的研究价值具有重要意义<sup>\[20\]</sup>。同时古籍收藏系统还在促进古籍社会化方面做出了一定贡献，通过用户上传古籍和交流区评论互动，提高了社会对于古籍数字化的参与程度，使社会化主体参加到古籍保护中来。

本文立足于课题背景及相关文献的基础上，首先对古籍的定义及其文化价值进行阐述，并系统梳理了国家层面对古籍数字化的政策，之后分析了古籍数字化国内外研究现状、电子阅读的发展情况以及目前古籍数字化存在的相关问题，指出了本文的研究目的和方向。之后通过分析项目梳理了古籍收藏系统的功能性与非功能性需求，并概述了其架构设计及核心功能模块。最后对古籍收藏系统进行测试和评估，保证其性能。

本系统在前端主要采用React、Ant
Design作为核心技术栈，辅以HTML、CSS等基础技术进行前端页面开发，优化交互效果，提升用户使用体验。采用Express框架搭建系统应用后台的基础架构，实现了对检索模块、古籍上传模块、交流区模块、古籍管理模块、用户管理模块以及个人中心模块等功能模块的设计。

<span id="_Toc19050" class="anchor"></span>**6.2 存在问题与改进方向**

本研究实现了基于React古籍收藏系统的基本设计要求，但仍存在若干问题。如古籍管理模块中，古籍数据存在存储挑战，可以采用图片压缩上传的方式，提高存储效率和降低存储压力，同时对于古籍的详细信息页面图片展示可以采用轮播图的形式，避免古籍图片的单一展示，丰富用户的视觉体验。数据检索和处理部分，可以进一步优化对数据检索和处理的方法，提高数据检索和存储的能力，给用户带来更好的使用体验。而在古籍上传和交流区方面，可以添加一些更为及时的审核功能确保古籍信息的准确和评论环境的保护。

<span id="_Toc10387" class="anchor"></span>**6.3 对未来展望**

今后将持续优化改进基于React的古籍收藏系统，在提升性能，提高数据处理速度，加强安全保障，设计与实现新的功能模块方面不断进步，为用户带来更好的使用体验，满足用户对于古籍交流的需求。

<span id="_Toc21258" class="anchor"></span>**参考文献**

\[1\] 国务院办公厅. 关于进一步加强古籍保护工作的意见(国办发〔2007〕6 号)
\[EB/OL\].(<http://www.gov.cn/zwgk/2007-01/29/content_511825.htm>,
2007-01-29.

\[2\] 中国青年报.习近平在联合国教科文组织总部的演讲
\[EB/OL\].(<http://news.cyol.com/xwzt/2019-04/30/content_18005876.htm>,
2019-04-30.

\[3\] 林钊然. 互联网背景下古籍知识平台移动端设计研究 \[D\], 2021.

\[4\] 文化部. 《“十三五”时期全国古籍保护工作规划》
\[EB/OL\].(<http://www.gov.cn/xinwen/2017-09/06/content_5223039.htm>,
2017-09-06.

\[5\] 娄明辉, 薛立静. 公共图书馆古籍工作社会化合作路径探究 \[J\].
河南图书馆学刊, 2023, 43(12): 28-32.

\[6\] 黄雅琴. 基于React框架的文档系统的设计与实现 \[D\]; 华中科技大学,
2017.

\[7\] 李晓纯, 孔文熙, 朱景福. 基于React的在线教学平台设计与实现 \[J\].
电脑知识与技术, 2021, 17(30): 95-7.

\[8\] 张郑宇强. 基于React技术的马拉松竞赛数据可视化平台的设计与应用研究
\[D\], 2023.

\[9\] LAKSHMI T V, RAKSHITHA L. The Power of React JS for Business
Applications \[J\]. International Research Journal on Advanced
Engineering and Management (IRJAEM), 2024, 2(05): 1637-9.

\[10\] DINKU Z. React. js vs. Next. js \[J\]. 2022.

\[11\] 李世钰, 张向先, 沈旺, et al.
古籍数字化国内外研究现状分析与路径构建研究 \[J\]. 现代情报, 2023,
43(11): 4-20.

\[12\] 齐晓晨, 孙臻, 解登峰.
古籍整理研究成果的全方位展示——馆藏古籍及藏书印展示平台的自主研发实践
\[J\]. 图书馆学刊, 2021, 43(01): 61-5+71.

\[13\] 齐江蕾. 古籍知识服务平台发展策略——以“籍合网”古籍整理工作平台为例
\[J\]. 中国编辑, 2022, (02): 60-5.

\[14\] CHAKRAVARTY S. E-Preservation of Old and Rare Books: A Structured
Approach for Creating a Digital Collection \[J\]. International Journal
of Digital Curation, 2023, 17(1): 8-.

\[15\] POUDEL J. Library Management System with React. Js \[J\]. 2023.

\[16\] 罗继尧. 博物馆藏品档案管理系统设计与实现 \[D\], 2017.

\[17\] 李晓婷. 基于React的机械设备故障诊断系统设计与开发 \[D\], 2022.

\[18\] YAN F. Development and implementation of data management and
analysis system for new power energy based on MVC \[J\]. Journal of
Computational Methods in Science and Engineering, 2019, 19(1_suppl):
253-8.

\[19\] NGUYEN D M. Design and implementation of a full stack React and
Node. js application: simulating driver’s license exams \[J\]. 2024.

\[20\] 陈晓涛. 基于SSM的数字化古籍书库的设计与实现 \[D\], 2019.

**致谢**

行文至此，本科生涯也即将结束，回首四年有笑有泪，有失有得，最后虽有遗憾但也逐渐释然。

首先由衷的感谢指导老师在论文创作中对我的帮助和指导，也感谢老师在其他方面对我的支持。以及感谢学院的每一位老师这四年对我的倾囊相授。

其次感谢家人和朋友们在我撰写论文路上给予的鼓励和支持，她们始终是我最坚强的后盾，感谢一路成长都有家人朋友相伴。

再者感谢一部部有声作品和幕后制作的他们在我无数个撰写论文和系统快要崩溃的深夜给了我一些精神上的慰藉。

最后感谢一下自己，这一路或许有挫折或许有失败，虽有退缩但贵在一直坚持，今后无论如何，请相信前路光明，坚守本心。
