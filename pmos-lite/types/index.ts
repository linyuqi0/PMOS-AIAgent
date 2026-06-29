export interface Project {
  id?: number;
  name: string;
  description: string;
  tags: string[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface PRD {
  id?: number;
  projectId?: number;
  title: string;
  description: string;
  content: string;
  background?: string;
  goals?: string;
  userStories?: string;
  businessFlow?: string;
  featureDesign?: string;
  exceptionFlow?: string;
  tracking?: string;
  acceptance?: string;
  testSuggestions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requirement {
  id?: number;
  projectId?: number;
  title: string;
  description: string;
  breakdown?: string;
  riskAnalysis?: string;
  devEstimate?: string;
  testEstimate?: string;
  launchRisk?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SQLQuery {
  id?: number;
  title: string;
  description: string;
  sql: string;
  dialect: 'mysql' | 'hive' | 'clickhouse' | 'starrocks';
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  id?: number;
  projectId?: number;
  eventName: string;
  eventDescription: string;
  properties: TrackingProperty[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface TestCase {
  id?: number;
  projectId?: number;
  prdId?: number;
  title: string;
  type: 'normal' | 'exception' | 'boundary' | 'permission' | 'compatibility';
  description: string;
  steps: string;
  expected: string;
  priority: 'high' | 'medium' | 'low';
  status: 'draft' | 'active';
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeDoc {
  id?: number;
  title: string;
  content: string;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'txt' | 'md';
  fileName: string;
  fileSize: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id?: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecentEdit {
  id?: number;
  type: 'project' | 'prd' | 'requirement' | 'sql' | 'tracking' | 'testcase' | 'knowledge' | 'prompt' | 'userstory' | 'competitor' | 'kano' | 'priority' | 'journey' | 'roi';
  itemId: number;
  title: string;
  editedAt: Date;
}

export interface UserStory {
  id?: number;
  projectId?: number;
  epic: string;
  role: string;
  action: string;
  value: string;
  acceptanceCriteria: string;
  storyPoints: number;
  priority: 'must' | 'should' | 'could' | 'wont';
  status: 'backlog' | 'doing' | 'done';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Competitor {
  id?: number;
  projectId?: number;
  name: string;
  website: string;
  positioning: string;
  targetUsers: string;
  coreFeatures: string;
  strengths: string;
  weaknesses: string;
  pricing: string;
  score: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KanoItem {
  id?: number;
  projectId?: number;
  featureName: string;
  category: 'basic' | 'performance' | 'excitement' | 'indifferent' | 'reverse';
  description: string;
  positiveQuestion: string;
  negativeQuestion: string;
  satisfaction: number;
  importance: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PriorityItem {
  id?: number;
  projectId?: number;
  name: string;
  description: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  riceScore: number;
  moscowCategory: 'must' | 'should' | 'could' | 'wont';
  value: number;
  complexity: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserJourney {
  id?: number;
  projectId?: number;
  persona: string;
  goal: string;
  stages: JourneyStage[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  touchpoint: string;
  emotion: 'happy' | 'neutral' | 'sad';
  painPoints: string;
  opportunities: string;
}

export interface RoiCalculation {
  id?: number;
  projectId?: number;
  name: string;
  description: string;
  developmentCost: number;
  operationCost: number;
  expectedRevenue: number;
  timeSaved: number;
  userGrowth: number;
  period: number;
  roi: number;
  paybackPeriod: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
