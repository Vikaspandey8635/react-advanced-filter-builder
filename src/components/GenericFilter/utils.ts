import { FilterCondition } from "./types";

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const isValidValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value))
    return value.length > 0 && value.every((v) => v !== null && v !== "");
  if (typeof value === "object") {
    if (value.from || value.to) return true;
    return Object.keys(value).length > 0;
  }
  return true;
};

export const formatFilterConditions = (conditions: FilterCondition[]): any => {
  const formattedConditions: any = {};

  conditions.forEach((condition) => {
    if (
      !condition.attribute ||
      !condition.operator ||
      !isValidValue(condition.value)
    ) {
      return;
    }

    if (!formattedConditions[condition.attribute]) {
      formattedConditions[condition.attribute] = {};
    }

    const operatorKey = `$${condition.operator.toLowerCase()}`;
    formattedConditions[condition.attribute][operatorKey] = condition.value;
  });

  return formattedConditions;
};

export const parseFilterConditions = (customFilter: any): FilterCondition[] => {
  const conditions: FilterCondition[] = [];

  if (!customFilter || typeof customFilter !== "object") {
    return conditions;
  }

  Object.keys(customFilter).forEach((attribute) => {
    const operators = customFilter[attribute];
    if (typeof operators !== "object") return;

    Object.keys(operators).forEach((operatorKey) => {
      const operator = operatorKey.replace("$", "");
      const value = operators[operatorKey];

      conditions.push({
        id: generateUniqueId(),
        attribute,
        operator: operator.charAt(0).toUpperCase() + operator.slice(1),
        value,
      });
    });
  });

  return conditions;
};

export const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};
