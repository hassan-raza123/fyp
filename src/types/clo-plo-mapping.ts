export interface CLOPLOMapping {
  id: number;
  cloId: number;
  ploId: number;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
  clo: {
    id: number;
    code: string;
    description: string;
  };
  plo: {
    id: number;
    code: string;
    description: string;
  };
}

export interface CreateCLOPLOMappingDTO {
  cloId: number;
  ploId: number;
  weight: number;
}

export interface UpdateCLOPLOMappingDTO {
  weight: number;
}

export interface CLOPLOMappingResponse {
  success: boolean;
  data?: CLOPLOMapping;
  error?: string;
}

export interface CLOPLOMappingListResponse {
  success: boolean;
  data?: CLOPLOMapping[];
  error?: string;
}
