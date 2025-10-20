import { FetchOptionsConfig } from "./types";

export async function executeFetchOptions(
  config: FetchOptionsConfig,
  dependencies?: Record<string, any>,
  axiosInstance?: any
): Promise<{ label: string; value: string }[]> {
  if (typeof config === "function") {
    return await config(dependencies);
  }

  if (config.type === "fetch") {
    return await handleFetchAPI(config, dependencies);
  }

  if (config.type === "axios") {
    return await handleAxios(config, dependencies, axiosInstance);
  }

  if (config.type === "custom") {
    const result = await config.handler(dependencies);
    if (config.transformResponse) {
      return config.transformResponse(result);
    }
    return result;
  }

  return [];
}

async function handleFetchAPI(
  config: Extract<FetchOptionsConfig, { type: "fetch" }>,
  dependencies?: Record<string, any>
): Promise<{ label: string; value: string }[]> {
  try {
    const url =
      typeof config.url === "function" ? config.url(dependencies) : config.url;

    const options: RequestInit = {
      method: config.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    if (config.body) {
      const body =
        typeof config.body === "function"
          ? config.body(dependencies)
          : config.body;
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (config.transformResponse) {
      return config.transformResponse(data);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch API error:", error);
    return [];
  }
}

async function handleAxios(
  config: Extract<FetchOptionsConfig, { type: "axios" }>,
  dependencies?: Record<string, any>,
  axiosInstance?: any
): Promise<{ label: string; value: string }[]> {
  try {
    if (!axiosInstance) {
      throw new Error(
        "Axios instance not provided. Please pass axiosInstance prop to GenericFilter."
      );
    }

    const url =
      typeof config.url === "function" ? config.url(dependencies) : config.url;

    const params =
      typeof config.params === "function"
        ? config.params(dependencies)
        : { ...config.params, ...dependencies };

    const data =
      typeof config.data === "function"
        ? config.data(dependencies)
        : config.data;

    const axiosConfig: any = {
      method: config.method || "GET",
      url,
      params: config.method === "GET" ? params : undefined,
      data: config.method === "POST" ? data || params : undefined,
      headers: config.headers,
    };

    const response = await axiosInstance(axiosConfig);

    if (config.transformResponse) {
      return config.transformResponse(response.data);
    }

    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  } catch (error) {
    console.error("Axios error:", error);
    return [];
  }
}

export const defaultTransformers = {
  unwrapData: (response: any) => response?.data || response,

  direct: (response: any) => response,

  mongoToOptions: (response: any) => {
    const items = Array.isArray(response) ? response : response?.data || [];
    return items.map((item: any) => ({
      label: item.name || item.label || item.title,
      value: item._id?.toString() || item.id || item.value,
    }));
  },

  restToOptions: (response: any) => {
    const items = Array.isArray(response) ? response : response?.data || [];
    return items.map((item: any) => ({
      label: item.name || item.label || item.title,
      value: item.id || item.value,
    }));
  },

  customMapper: (labelKey: string, valueKey: string) => (response: any) => {
    const items = Array.isArray(response) ? response : response?.data || [];
    return items.map((item: any) => ({
      label: item[labelKey],
      value: item[valueKey],
    }));
  },
};
