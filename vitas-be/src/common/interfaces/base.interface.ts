export interface IBaseEntity {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBaseQuery {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IBaseResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface IHealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  services: {
    database: boolean;
    redis?: boolean;
    fiinquant?: boolean;
  };
}
