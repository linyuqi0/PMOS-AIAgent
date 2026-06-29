import Dexie, { type Table } from 'dexie';
import type {
  Project,
  PRD,
  Requirement,
  SQLQuery,
  TrackingEvent,
  TestCase,
  KnowledgeDoc,
  Prompt,
  RecentEdit,
  UserStory,
  Competitor,
  KanoItem,
  PriorityItem,
  UserJourney,
  RoiCalculation,
} from '@/types';

export class PMOSDatabase extends Dexie {
  projects!: Table<Project, number>;
  prds!: Table<PRD, number>;
  requirements!: Table<Requirement, number>;
  sqlQueries!: Table<SQLQuery, number>;
  trackingEvents!: Table<TrackingEvent, number>;
  testCases!: Table<TestCase, number>;
  knowledgeDocs!: Table<KnowledgeDoc, number>;
  prompts!: Table<Prompt, number>;
  recentEdits!: Table<RecentEdit, number>;
  userStories!: Table<UserStory, number>;
  competitors!: Table<Competitor, number>;
  kanoItems!: Table<KanoItem, number>;
  priorityItems!: Table<PriorityItem, number>;
  userJourneys!: Table<UserJourney, number>;
  roiCalculations!: Table<RoiCalculation, number>;

  constructor() {
    super('PMOSLiteDB');

    this.version(2).stores({
      projects: '++id, name, status, createdAt, updatedAt, *tags',
      prds: '++id, projectId, title, createdAt, updatedAt',
      requirements: '++id, projectId, title, createdAt, updatedAt',
      sqlQueries: '++id, title, dialect, isFavorite, createdAt, updatedAt, *tags',
      trackingEvents: '++id, projectId, eventName, createdAt, updatedAt',
      testCases: '++id, projectId, prdId, type, priority, status, createdAt, updatedAt',
      knowledgeDocs: '++id, title, fileType, createdAt, updatedAt, *tags',
      prompts: '++id, title, category, isFavorite, createdAt, updatedAt, *tags',
      recentEdits: '++id, type, itemId, editedAt',
      userStories: '++id, projectId, epic, priority, status, storyPoints, createdAt, updatedAt, *tags',
      competitors: '++id, projectId, name, score, createdAt, updatedAt, *tags',
      kanoItems: '++id, projectId, featureName, category, satisfaction, importance, createdAt, updatedAt, *tags',
      priorityItems: '++id, projectId, name, riceScore, moscowCategory, value, complexity, createdAt, updatedAt, *tags',
      userJourneys: '++id, projectId, persona, goal, createdAt, updatedAt, *tags',
      roiCalculations: '++id, projectId, name, roi, paybackPeriod, createdAt, updatedAt, *tags',
    });
  }

  async addRecentEdit(type: RecentEdit['type'], itemId: number, title: string) {
    const existing = await this.recentEdits
      .where({ type, itemId })
      .first();

    if (existing && existing.id) {
      await this.recentEdits.update(existing.id, {
        editedAt: new Date(),
        title,
      });
    } else {
      await this.recentEdits.add({
        type,
        itemId,
        title,
        editedAt: new Date(),
      });
    }

    const all = await this.recentEdits
      .orderBy('editedAt')
      .reverse()
      .toArray();

    if (all.length > 20) {
      const toDelete = all.slice(20);
      await this.recentEdits.bulkDelete(
        toDelete.filter((e) => e.id).map((e) => e.id as number)
      );
    }
  }

  async exportData(): Promise<string> {
    const [projects, prds, requirements, sqlQueries, trackingEvents, testCases, knowledgeDocs, prompts, userStories, competitors, kanoItems, priorityItems, userJourneys, roiCalculations] =
      await Promise.all([
        this.projects.toArray(),
        this.prds.toArray(),
        this.requirements.toArray(),
        this.sqlQueries.toArray(),
        this.trackingEvents.toArray(),
        this.testCases.toArray(),
        this.knowledgeDocs.toArray(),
        this.prompts.toArray(),
        this.userStories.toArray(),
        this.competitors.toArray(),
        this.kanoItems.toArray(),
        this.priorityItems.toArray(),
        this.userJourneys.toArray(),
        this.roiCalculations.toArray(),
      ]);

    return JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: {
          projects,
          prds,
          requirements,
          sqlQueries,
          trackingEvents,
          testCases,
          knowledgeDocs,
          prompts,
          userStories,
          competitors,
          kanoItems,
          priorityItems,
          userJourneys,
          roiCalculations,
        },
      },
      null,
      2
    );
  }

  async importData(jsonStr: string): Promise<void> {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.data) throw new Error('Invalid backup format');

    const { data } = parsed;

    await this.transaction('rw', this.tables, async () => {
      if (data.projects?.length) {
        await this.projects.bulkPut(data.projects.map(mapDates));
      }
      if (data.prds?.length) {
        await this.prds.bulkPut(data.prds.map(mapDates));
      }
      if (data.requirements?.length) {
        await this.requirements.bulkPut(data.requirements.map(mapDates));
      }
      if (data.sqlQueries?.length) {
        await this.sqlQueries.bulkPut(data.sqlQueries.map(mapDates));
      }
      if (data.trackingEvents?.length) {
        await this.trackingEvents.bulkPut(data.trackingEvents.map(mapDates));
      }
      if (data.testCases?.length) {
        await this.testCases.bulkPut(data.testCases.map(mapDates));
      }
      if (data.knowledgeDocs?.length) {
        await this.knowledgeDocs.bulkPut(data.knowledgeDocs.map(mapDates));
      }
      if (data.prompts?.length) {
        await this.prompts.bulkPut(data.prompts.map(mapDates));
      }
      if (data.userStories?.length) {
        await this.userStories.bulkPut(data.userStories.map(mapDates));
      }
      if (data.competitors?.length) {
        await this.competitors.bulkPut(data.competitors.map(mapDates));
      }
      if (data.kanoItems?.length) {
        await this.kanoItems.bulkPut(data.kanoItems.map(mapDates));
      }
      if (data.priorityItems?.length) {
        await this.priorityItems.bulkPut(data.priorityItems.map(mapDates));
      }
      if (data.userJourneys?.length) {
        await this.userJourneys.bulkPut(data.userJourneys.map(mapDates));
      }
      if (data.roiCalculations?.length) {
        await this.roiCalculations.bulkPut(data.roiCalculations.map(mapDates));
      }
    });
  }
}

function mapDates<T extends { createdAt: string | Date; updatedAt: string | Date }>(item: T): T {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

export const db = new PMOSDatabase();

export async function seedInitialData() {
  const now = new Date();

  const promptCount = await db.prompts.count();
  if (promptCount === 0) {
    const defaultPrompts: Omit<Prompt, 'id'>[] = [
      {
        title: 'PRD 需求背景分析',
        category: '产品经理',
        content: `请作为资深产品经理，分析以下需求的背景：

需求描述：{需求描述}

请从以下维度分析：
1. 市场背景与行业趋势
2. 用户痛点
3. 业务价值
4. 竞品现状
5. 机会与挑战`,
        tags: ['PRD', '背景分析', '产品'],
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '用户故事生成',
        category: '产品经理',
        content: `请将以下功能需求转化为标准用户故事格式：

功能描述：{功能描述}

输出格式：
- 作为 [用户角色]
- 我想要 [功能目标]
- 以便于 [价值/收益]

请列出 3-5 个核心用户故事，并按优先级排序。`,
        tags: ['用户故事', '敏捷', 'PRD'],
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '埋点事件设计',
        category: '埋点',
        content: `请为以下功能设计完整的埋点方案：

功能描述：{功能描述}

请输出：
1. 核心事件列表（事件名+触发时机）
2. 每个事件的属性设计
3. 关键漏斗分析建议
4. 数据验证方法`,
        tags: ['埋点', '数据分析', '事件设计'],
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'SQL 查询优化',
        category: 'BI',
        content: `请分析以下 SQL 查询并提供优化建议：

\`\`\`sql
{SQL语句}
\`\`\`

数据库类型：{MySQL/Hive/ClickHouse/StarRocks}

请从以下角度分析：
1. 执行计划分析
2. 索引优化建议
3. 改写后的 SQL
4. 性能提升预估`,
        tags: ['SQL', '优化', 'BI'],
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '测试用例设计',
        category: '产品经理',
        content: `请为以下功能设计全面的测试用例：

功能描述：{功能描述}
业务流程：{业务流程}

请覆盖：
1. 正常流程用例
2. 异常流程用例
3. 边界条件用例
4. 权限相关用例
5. 兼容性用例`,
        tags: ['测试', 'QA', '用例设计'],
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '周报生成',
        category: '运营',
        content: `请根据以下工作内容生成一份专业的周报：

本周工作：{工作内容}
下周计划：{下周计划}
遇到的问题：{问题}

周报风格：简洁专业、数据驱动、突出成果`,
        tags: ['周报', '运营', '汇报'],
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '数据仓库维度建模',
        category: '数仓',
        content: `请为以下业务场景设计数仓维度模型：

业务场景：{业务场景描述}
核心业务过程：{业务过程}

请输出：
1. 总线矩阵设计
2. 事实表设计（粒度、度量）
3. 维度表设计
4. 缓慢变化维处理策略`,
        tags: ['数仓', '维度建模', '数据中台'],
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'AI 产品需求评估',
        category: 'AI产品',
        content: `请评估以下 AI 产品需求的可行性：

需求描述：{需求描述}
预期效果：{预期效果}

请从以下维度评估：
1. 技术可行性（现有技术成熟度）
2. 数据需求
3. 成本预估
4. 风险点
5. MVP 方案建议`,
        tags: ['AI', '产品评估', '可行性分析'],
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '竞品分析报告',
        category: '产品经理',
        content: `请对以下竞品进行深度分析：

产品名称：{产品名称}
分析维度：{分析维度/功能点}

请输出：
1. 产品定位与目标用户
2. 核心功能拆解
3. 交互体验亮点
4. 商业模式分析
5. 可借鉴点与差异化机会`,
        tags: ['竞品', '产品分析', '市场调研'],
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.prompts.bulkAdd(defaultPrompts);
  }

  const sqlCount = await db.sqlQueries.count();
  if (sqlCount === 0) {
    const defaultSqls: Omit<SQLQuery, 'id'>[] = [
      {
        title: '日活用户数（DAU）',
        description: '统计每日活跃用户数，按日期分组',
        sql: `SELECT 
  DATE(login_time) AS stat_date,
  COUNT(DISTINCT user_id) AS dau
FROM user_login_log
WHERE login_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(login_time)
ORDER BY stat_date DESC;`,
        dialect: 'mysql',
        isFavorite: true,
        tags: ['DAU', '用户分析', '日活'],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '用户留存率计算',
        description: '计算次日、7日、30日留存率',
        sql: `WITH first_login AS (
  SELECT user_id, MIN(DATE(login_time)) AS first_date
  FROM user_login_log
  GROUP BY user_id
),
retention AS (
  SELECT 
    f.first_date,
    COUNT(DISTINCT f.user_id) AS new_users,
    COUNT(DISTINCT CASE WHEN DATEDIFF(l.login_time, f.first_date) = 1 THEN l.user_id END) AS d1_retention,
    COUNT(DISTINCT CASE WHEN DATEDIFF(l.login_time, f.first_date) = 7 THEN l.user_id END) AS d7_retention,
    COUNT(DISTINCT CASE WHEN DATEDIFF(l.login_time, f.first_date) = 30 THEN l.user_id END) AS d30_retention
  FROM first_login f
  LEFT JOIN user_login_log l ON f.user_id = l.user_id
  GROUP BY f.first_date
)
SELECT 
  first_date,
  new_users,
  ROUND(d1_retention / new_users * 100, 2) AS d1_rate,
  ROUND(d7_retention / new_users * 100, 2) AS d7_rate,
  ROUND(d30_retention / new_users * 100, 2) AS d30_rate
FROM retention
ORDER BY first_date DESC;`,
        dialect: 'mysql',
        isFavorite: true,
        tags: ['留存', '用户分析', '经典指标'],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: '漏斗分析',
        description: '多步骤转化率漏斗分析',
        sql: `SELECT 
  'step1_visit' AS step,
  COUNT(DISTINCT user_id) AS user_count,
  100 AS conversion_rate
FROM page_view
WHERE page_name = 'home'
  AND dt = '2024-01-01'

UNION ALL

SELECT 
  'step2_detail' AS step,
  COUNT(DISTINCT p.user_id) AS user_count,
  ROUND(COUNT(DISTINCT p.user_id) / t.total * 100, 2) AS conversion_rate
FROM page_view p
CROSS JOIN (SELECT COUNT(DISTINCT user_id) AS total FROM page_view WHERE page_name = 'home' AND dt = '2024-01-01') t
WHERE p.page_name = 'product_detail'
  AND p.dt = '2024-01-01'

UNION ALL

SELECT 
  'step3_order' AS step,
  COUNT(DISTINCT o.user_id) AS user_count,
  ROUND(COUNT(DISTINCT o.user_id) / t.total * 100, 2) AS conversion_rate
FROM orders o
CROSS JOIN (SELECT COUNT(DISTINCT user_id) AS total FROM page_view WHERE page_name = 'home' AND dt = '2024-01-01') t
WHERE o.dt = '2024-01-01';`,
        dialect: 'hive',
        isFavorite: false,
        tags: ['漏斗', '转化率', 'Hive'],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Top N 商品销售排行',
        description: '按销售额排序的商品 Top N 榜单',
        sql: `SELECT 
  product_id,
  product_name,
  SUM(quantity) AS total_quantity,
  SUM(amount) AS total_amount,
  RANK() OVER (ORDER BY SUM(amount) DESC) AS rank_num
FROM order_details
WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND status = 'completed'
GROUP BY product_id, product_name
ORDER BY total_amount DESC
LIMIT 20;`,
        dialect: 'mysql',
        isFavorite: true,
        tags: ['销售', '排行榜', '窗口函数'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.sqlQueries.bulkAdd(defaultSqls);
  }

  const userStoryCount = await db.userStories.count();
  if (userStoryCount === 0) {
    const defaultStories: Omit<UserStory, 'id'>[] = [
      {
        epic: '用户注册登录',
        role: '新用户',
        action: '通过手机号注册账号',
        value: '快速开始使用产品',
        acceptanceCriteria: '1. 输入手机号获取验证码\n2. 验证码60秒倒计时\n3. 注册成功自动登录',
        storyPoints: 5,
        priority: 'must',
        status: 'done',
        tags: ['核心流程', '用户体系'],
        createdAt: now,
        updatedAt: now,
      },
      {
        epic: '用户注册登录',
        role: '已注册用户',
        action: '使用密码登录系统',
        value: '访问我的数据和功能',
        acceptanceCriteria: '1. 支持手机号/邮箱登录\n2. 密码错误提示清晰\n3. 连续5次错误锁定15分钟',
        storyPoints: 3,
        priority: 'must',
        status: 'done',
        tags: ['核心流程', '用户体系'],
        createdAt: now,
        updatedAt: now,
      },
      {
        epic: '内容浏览',
        role: '访客',
        action: '浏览首页推荐内容',
        value: '快速了解产品价值',
        acceptanceCriteria: '1. 无需登录即可浏览\n2. 支持下拉刷新\n3. 内容卡片展示清晰',
        storyPoints: 8,
        priority: 'should',
        status: 'doing',
        tags: ['内容', '首页'],
        createdAt: now,
        updatedAt: now,
      },
      {
        epic: '内容浏览',
        role: '注册用户',
        action: '收藏感兴趣的内容',
        value: '之后快速找到并查看',
        acceptanceCriteria: '1. 点击星星图标收藏\n2. 个人中心查看收藏列表\n3. 支持取消收藏',
        storyPoints: 2,
        priority: 'could',
        status: 'backlog',
        tags: ['内容', '互动'],
        createdAt: now,
        updatedAt: now,
      },
      {
        epic: '数据分析',
        role: '运营人员',
        action: '查看用户行为数据报表',
        value: '掌握产品运营状况',
        acceptanceCriteria: '1. DAU/留存/转化率等核心指标\n2. 支持按日期筛选\n3. 支持导出Excel',
        storyPoints: 13,
        priority: 'should',
        status: 'backlog',
        tags: ['数据', '运营'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.userStories.bulkAdd(defaultStories);
  }

  const competitorCount = await db.competitors.count();
  if (competitorCount === 0) {
    const defaultCompetitors: Omit<Competitor, 'id'>[] = [
      {
        name: '产品A',
        website: 'https://product-a.com',
        positioning: '面向中小企业的一站式SaaS平台',
        targetUsers: '10-50人规模的中小企业主、运营负责人',
        coreFeatures: '项目管理、团队协作、数据分析、客户管理',
        strengths: '功能全面、界面美观、价格亲民、用户基数大',
        weaknesses: '定制化能力弱、高级功能需付费、响应速度慢',
        pricing: '免费版 + 99元/人/月专业版',
        score: 85,
        tags: ['SaaS', '项目管理', '直接竞品'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '产品B',
        website: 'https://product-b.com',
        positioning: '专注于AI赋能的智能工作台',
        targetUsers: '产品经理、运营、数据分析师',
        coreFeatures: 'AI助手、数据分析、文档协作、需求管理',
        strengths: 'AI能力强、数据洞察准确、用户体验好',
        weaknesses: '价格较高、功能深度不足、生态不完善',
        pricing: '299元/人/月起',
        score: 78,
        tags: ['AI', '智能工具', '间接竞品'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '产品C',
        website: 'https://product-c.com',
        positioning: '轻量级团队协作工具',
        targetUsers: '创业团队、小型工作室',
        coreFeatures: '任务管理、即时通讯、文件共享',
        strengths: '简单易用、上手快、免费功能足够用',
        weaknesses: '功能少、不适合复杂项目、数据导出难',
        pricing: '免费版 + 49元/人/月',
        score: 72,
        tags: ['协作', '轻量级', '潜在竞品'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.competitors.bulkAdd(defaultCompetitors);
  }

  const kanoCount = await db.kanoItems.count();
  if (kanoCount === 0) {
    const defaultKanoItems: Omit<KanoItem, 'id'>[] = [
      {
        featureName: '用户登录注册',
        category: 'basic',
        description: '基础账号体系，用户登录注册功能',
        positiveQuestion: '如果产品支持登录注册，你觉得？',
        negativeQuestion: '如果产品不支持登录注册，你觉得？',
        satisfaction: 2,
        importance: 5,
        tags: ['基础功能', '用户体系'],
        createdAt: now,
        updatedAt: now,
      },
      {
        featureName: '消息推送通知',
        category: 'performance',
        description: '重要事件的消息推送和通知提醒',
        positiveQuestion: '如果有消息推送提醒，你觉得？',
        negativeQuestion: '如果没有消息推送提醒，你觉得？',
        satisfaction: 4,
        importance: 4,
        tags: ['通知', '用户体验'],
        createdAt: now,
        updatedAt: now,
      },
      {
        featureName: 'AI智能推荐',
        category: 'excitement',
        description: '基于用户行为的个性化内容推荐',
        positiveQuestion: '如果有AI智能推荐功能，你觉得？',
        negativeQuestion: '如果没有AI智能推荐功能，你觉得？',
        satisfaction: 5,
        importance: 2,
        tags: ['AI', '推荐', '差异化'],
        createdAt: now,
        updatedAt: now,
      },
      {
        featureName: '主题皮肤切换',
        category: 'indifferent',
        description: '多种主题皮肤供用户选择切换',
        positiveQuestion: '如果支持主题皮肤切换，你觉得？',
        negativeQuestion: '如果不支持主题皮肤切换，你觉得？',
        satisfaction: 2,
        importance: 1,
        tags: ['美化', '低优先级'],
        createdAt: now,
        updatedAt: now,
      },
      {
        featureName: '自动分享到社交平台',
        category: 'reverse',
        description: '自动将用户活动分享到社交媒体',
        positiveQuestion: '如果自动分享到社交平台，你觉得？',
        negativeQuestion: '如果不自动分享到社交平台，你觉得？',
        satisfaction: 1,
        importance: 1,
        tags: ['反需求', '隐私'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.kanoItems.bulkAdd(defaultKanoItems);
  }

  const priorityCount = await db.priorityItems.count();
  if (priorityCount === 0) {
    const defaultPriorities: Omit<PriorityItem, 'id'>[] = [
      {
        name: '用户登录注册',
        description: '基础账号体系建设',
        reach: 10000,
        impact: 5,
        confidence: 0.95,
        effort: 8,
        riceScore: 5938,
        moscowCategory: 'must',
        value: 9,
        complexity: 5,
        tags: ['核心', 'P0'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '首页内容推荐',
        description: '个性化首页内容推荐算法',
        reach: 8000,
        impact: 4,
        confidence: 0.7,
        effort: 13,
        riceScore: 1723,
        moscowCategory: 'should',
        value: 8,
        complexity: 8,
        tags: ['推荐', 'AI'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '消息推送系统',
        description: '多渠道消息推送和通知中心',
        reach: 6000,
        impact: 3,
        confidence: 0.85,
        effort: 5,
        riceScore: 3060,
        moscowCategory: 'should',
        value: 7,
        complexity: 4,
        tags: ['通知', '触达'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '深色模式支持',
        description: '深色主题模式切换',
        reach: 2000,
        impact: 2,
        confidence: 0.9,
        effort: 3,
        riceScore: 1200,
        moscowCategory: 'could',
        value: 4,
        complexity: 2,
        tags: ['美化', '体验优化'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '3D交互动效',
        description: '炫酷的3D交互动画效果',
        reach: 500,
        impact: 2,
        confidence: 0.5,
        effort: 21,
        riceScore: 24,
        moscowCategory: 'wont',
        value: 3,
        complexity: 10,
        tags: ['炫技', '低ROI'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.priorityItems.bulkAdd(defaultPriorities);
  }

  const journeyCount = await db.userJourneys.count();
  if (journeyCount === 0) {
    const defaultJourneys: Omit<UserJourney, 'id'>[] = [
      {
        persona: '新注册用户 - 小王，28岁，互联网运营',
        goal: '完成首次产品使用并体验核心价值',
        stages: [
          {
            id: 's1',
            name: '发现产品',
            description: '通过朋友推荐或广告了解到产品',
            touchpoint: '朋友圈/广告/应用商店',
            emotion: 'neutral',
            painPoints: '产品描述不清晰，不知道能解决什么问题',
            opportunities: '优化应用商店介绍文案，突出核心价值',
          },
          {
            id: 's2',
            name: '注册账号',
            description: '下载App并完成注册',
            touchpoint: 'App注册页',
            emotion: 'happy',
            painPoints: '注册流程太长，需要填写太多信息',
            opportunities: '支持一键登录，简化注册步骤',
          },
          {
            id: 's3',
            name: '新手引导',
            description: '完成新手引导了解功能',
            touchpoint: '新手引导页',
            emotion: 'happy',
            painPoints: '引导步骤太多，想直接跳过',
            opportunities: '提供跳过选项，关键功能做气泡提示',
          },
          {
            id: 's4',
            name: '首次使用',
            description: '第一次使用核心功能',
            touchpoint: '首页/核心功能页',
            emotion: 'neutral',
            painPoints: '不知道从哪里开始，功能太多眼花缭乱',
            opportunities: '提供任务式引导，帮助用户完成首个任务',
          },
          {
            id: 's5',
            name: '留存回访',
            description: '第二天再次打开使用',
            touchpoint: 'Push推送/短信',
            emotion: 'sad',
            painPoints: '用完即走，没有回访动力',
            opportunities: '设计回访机制，如每日推荐、签到奖励等',
          },
        ],
        tags: ['新用户', '核心流程', 'Aha时刻'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.userJourneys.bulkAdd(defaultJourneys);
  }

  const roiCount = await db.roiCalculations.count();
  if (roiCount === 0) {
    const defaultRois: Omit<RoiCalculation, 'id'>[] = [
      {
        name: '首页推荐算法优化',
        description: '优化首页个性化推荐算法，提升用户停留时长',
        developmentCost: 200000,
        operationCost: 50000,
        expectedRevenue: 500000,
        timeSaved: 0,
        userGrowth: 15,
        period: 12,
        roi: 100,
        paybackPeriod: 6,
        tags: ['算法', '推荐', '高ROI'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '客服机器人系统',
        description: '引入AI客服机器人，降低人工客服成本',
        developmentCost: 150000,
        operationCost: 30000,
        expectedRevenue: 0,
        timeSaved: 40,
        userGrowth: 0,
        period: 12,
        roi: 217,
        paybackPeriod: 4,
        tags: ['AI', '客服', '降本'],
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '数据可视化大屏',
        description: '建设数据可视化大屏，提升管理决策效率',
        developmentCost: 300000,
        operationCost: 20000,
        expectedRevenue: 100000,
        timeSaved: 20,
        userGrowth: 0,
        period: 12,
        roi: -58,
        paybackPeriod: -1,
        tags: ['数据', '可视化', '低ROI'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.roiCalculations.bulkAdd(defaultRois);
  }
}
