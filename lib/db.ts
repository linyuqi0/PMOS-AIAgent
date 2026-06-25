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

  constructor() {
    super('PMOSLiteDB');

    this.version(1).stores({
      projects: '++id, name, status, createdAt, updatedAt, *tags',
      prds: '++id, projectId, title, createdAt, updatedAt',
      requirements: '++id, projectId, title, createdAt, updatedAt',
      sqlQueries: '++id, title, dialect, isFavorite, createdAt, updatedAt, *tags',
      trackingEvents: '++id, projectId, eventName, createdAt, updatedAt',
      testCases: '++id, projectId, prdId, type, priority, status, createdAt, updatedAt',
      knowledgeDocs: '++id, title, fileType, createdAt, updatedAt, *tags',
      prompts: '++id, title, category, isFavorite, createdAt, updatedAt, *tags',
      recentEdits: '++id, type, itemId, editedAt',
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
    const [projects, prds, requirements, sqlQueries, trackingEvents, testCases, knowledgeDocs, prompts] =
      await Promise.all([
        this.projects.toArray(),
        this.prds.toArray(),
        this.requirements.toArray(),
        this.sqlQueries.toArray(),
        this.trackingEvents.toArray(),
        this.testCases.toArray(),
        this.knowledgeDocs.toArray(),
        this.prompts.toArray(),
      ]);

    return JSON.stringify(
      {
        version: 1,
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
  const promptCount = await db.prompts.count();
  if (promptCount > 0) return;

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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.prompts.bulkAdd(defaultPrompts);
}
