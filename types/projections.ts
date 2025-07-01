export interface ProjectionScenario {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_baseline: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectionHarvestData {
  id: string;
  scenario_id: string;
  harvest_id: string;
  dollar_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  harvest?: {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
  };
}

export interface ProjectionCultureData {
  id: string;
  scenario_id: string;
  harvest_id: string;
  culture_id: string;
  area_hectares: number;
  productivity: number;
  productivity_unit: string;
  price_per_unit: number;
  created_at: string;
  updated_at: string;
  culture?: {
    id: string;
    name: string;
  };
}

export interface ProjectionFormData {
  scenario: ProjectionScenario;
  harvestData: ProjectionHarvestData[];
  cultureData: ProjectionCultureData[];
}

export interface ProjectionSummary {
  scenario_id: string;
  scenario_name: string;
  total_area: number;
  total_revenue: number;
  average_dollar_rate: number;
  culture_breakdown: {
    culture_name: string;
    area: number;
    revenue: number;
    percentage: number;
  }[];
}