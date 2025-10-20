export type OperatorType = "default" | "select" | "date" | "number";

export interface FilterCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | { from?: Date; to?: Date } | any;
}

export type FetchOptionsFunction = (
  dependencies?: Record<string, any>
) => Promise<{ label: string; value: string }[]>;

export type FetchOptionsConfig =
  | FetchOptionsFunction
  | {
      type: "fetch";
      url: string | ((dependencies?: Record<string, any>) => string);
      method?: "GET" | "POST" | "PUT" | "DELETE";
      headers?: Record<string, string>;
      body?: any | ((dependencies?: Record<string, any>) => any);
      transformResponse?: (data: any) => { label: string; value: string }[];
    }
  | {
      type: "axios";
      url: string | ((dependencies?: Record<string, any>) => string);
      method?: "GET" | "POST" | "PUT" | "DELETE";
      params?:
        | Record<string, any>
        | ((dependencies?: Record<string, any>) => Record<string, any>);
      data?: any | ((dependencies?: Record<string, any>) => any);
      headers?: Record<string, string>;
      transformResponse?: (data: any) => { label: string; value: string }[];
    }
  | {
      type: "custom";
      handler: (dependencies?: Record<string, any>) => Promise<any>;
      transformResponse?: (data: any) => { label: string; value: string }[];
    };

export interface AttributeOption {
  label: string;
  value: string;
  type: "Text" | "Number" | "Date" | "Select" | "DropDown";
  options?: { label: string; value: string }[];
  fetchOptions?: FetchOptionsConfig;
  dependsOn?: string[];
  clearOnDependencyChange?: boolean;
}

export interface SortConfig {
  field: string;
  order: "asc" | "desc";
}

export interface FilterParams {
  customFilter?: any;
  customSortFilter?: { sort: SortConfig };
  page?: number;
  forcePage?: number;
  isDeleted?: boolean;
  [key: string]: any;
}

export interface GenericFilterProps {
  attributeOptions: AttributeOption[];
  onApply: (params: FilterParams) => void;
  onCancel: () => void;
  initialFilters?: FilterParams;
  isOpen?: boolean;
  showArchive?: boolean;
  showSort?: boolean;
  maxConditions?: number;
  defaultConditionsCount?: number;
  axiosInstance?: any;
  onReset?: () => void;
  className?: string;
}

export interface OperatorOption {
  label: string;
  value: string;
}
