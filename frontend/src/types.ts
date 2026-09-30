export interface FeatureDetail {
  feature: string;
  effortInDays: number;
}

export interface ScreenBreakdown {
  totalEffort: number;
  features: FeatureDetail[];
}

export interface AppBreakdown {
  totalEffort: number;
  screens: Record<string, ScreenBreakdown>;
}

export interface ScheduleItem {
  id: number;
  application: string;
  screen: string;
  feature: string;
  effortInDays: number;
  assignedDeveloper: string;
  startDateFormatted: string;
  endDateFormatted: string;
}

export interface PlanSummary {
  totalTasks: number;
  totalEffortDays: number;
  totalDevelopers: number;
  projectStartDate: string;
  projectEndDate: string;
}

export interface PlanResponse {
  summary: PlanSummary;
  breakdownByApp: Record<string, AppBreakdown>;
  schedule: ScheduleItem[];
}