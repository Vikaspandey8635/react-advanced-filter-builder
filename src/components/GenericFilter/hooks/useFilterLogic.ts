import { useState, useCallback } from "react";
import { FilterCondition, AttributeOption, FilterParams } from "../types";
import {
  generateUniqueId,
  formatFilterConditions,
  parseFilterConditions,
  isValidValue,
} from "../utils";

export const useFilterLogic = (
  attributeOptions: AttributeOption[],
  initialFilters?: FilterParams,
  defaultConditionsCount: number = 3
) => {
  const createEmptyCondition = (): FilterCondition => ({
    id: generateUniqueId(),
    attribute: "",
    operator: "Equals",
    value: "",
  });

  const [conditions, setConditions] = useState<FilterCondition[]>(() => {
    if (initialFilters?.customFilter) {
      return parseFilterConditions(initialFilters.customFilter);
    }
    return Array.from({ length: defaultConditionsCount }, createEmptyCondition);
  });

  const [sortField, setSortField] = useState<string>(
    initialFilters?.customSortFilter?.sort?.field || ""
  );
  const [sortOrder, setSortOrder] = useState<string>(
    initialFilters?.customSortFilter?.sort?.order || ""
  );
  const [archive, setArchive] = useState<boolean>(
    initialFilters?.isDeleted || false
  );
  const [error, setError] = useState<string>("");

  const addCondition = useCallback(() => {
    setConditions((prev) => [...prev, createEmptyCondition()]);
  }, []);

  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((condition) => condition.id !== id));
  }, []);

  const updateCondition = useCallback(
    (id: string, field: keyof FilterCondition, value: any) => {
      setConditions((prev) =>
        prev.map((condition) => {
          if (condition.id !== id) return condition;

          if (field === "attribute") {
            return {
              ...condition,
              attribute: value,
              operator: "Equals",
              value: "",
            };
          }

          if (field === "operator") {
            const attributeOption = attributeOptions.find(
              (opt) => opt.value === condition.attribute
            );
            const isDate = attributeOption?.type === "Date";

            if (value === "Between" && isDate) {
              return {
                ...condition,
                operator: value,
                value: ["", ""],
              };
            }

            return {
              ...condition,
              operator: value,
              value: "",
            };
          }

          return { ...condition, [field]: value };
        })
      );
    },
    [attributeOptions]
  );

  const resetFilters = useCallback(() => {
    setConditions(
      Array.from({ length: defaultConditionsCount }, createEmptyCondition)
    );
    setSortField("");
    setSortOrder("");
    setArchive(false);
    setError("");
  }, [defaultConditionsCount]);

  const validateAndBuildParams = useCallback((): {
    valid: boolean;
    params?: FilterParams;
    error?: string;
  } => {
    const validFilters = conditions.filter(
      (filter) =>
        filter.attribute?.trim() &&
        filter.operator?.trim() &&
        isValidValue(filter.value)
    );

    const hasValidSort = !!(sortField && sortOrder);
    const hasValidFilter = validFilters.length > 0;

    if (!hasValidSort && !hasValidFilter) {
      return {
        valid: false,
        error:
          "At least one valid filter condition or sort option is required.",
      };
    }

    const filterParams: FilterParams = {
      page: 1,
      forcePage: 0,
      isDeleted: archive,
    };

    if (hasValidFilter) {
      filterParams.customFilter = formatFilterConditions(validFilters);
    }

    if (hasValidSort) {
      filterParams.customSortFilter = {
        sort: {
          field: sortField,
          order: sortOrder as "asc" | "desc",
        },
      };
    }

    return { valid: true, params: filterParams };
  }, [conditions, sortField, sortOrder, archive]);

  const getOperatorsForAttribute = useCallback(
    (attribute: string) => {
      const attributeOption = attributeOptions.find(
        (opt) => opt.value === attribute
      );
      const attributeType = attributeOption?.type;

      const OPERATORS = {
        default: [
          { label: "Equals", value: "Equals" },
          { label: "Not Equals", value: "NotEquals" },
          { label: "Contains", value: "Like" },
        ],
        select: [
          { label: "Equals", value: "Equals" },
          { label: "Not Equals", value: "NotEquals" },
        ],
        date: [
          { label: "Equals", value: "Equals" },
          { label: "Not Equals", value: "NotEquals" },
          { label: "Before", value: "LessThan" },
          { label: "After", value: "GreaterThan" },
          { label: "Between", value: "Between" },
        ],
        number: [
          { label: "Equals", value: "Equals" },
          { label: "Not Equals", value: "NotEquals" },
          { label: "Greater Than", value: "GreaterThan" },
          { label: "Less Than", value: "LessThan" },
          { label: "Greater Than Equals", value: "GreaterThanEquals" },
          { label: "Less Than Equals", value: "LessThanEquals" },
        ],
      };

      if (attributeType === "Date") return OPERATORS.date;
      if (attributeType === "Number") return OPERATORS.number;
      if (attributeType === "Select" || attributeType === "DropDown")
        return OPERATORS.select;
      return OPERATORS.default;
    },
    [attributeOptions]
  );

  return {
    conditions,
    sortField,
    sortOrder,
    archive,
    error,
    setConditions,
    setSortField,
    setSortOrder,
    setArchive,
    setError,
    addCondition,
    removeCondition,
    updateCondition,
    resetFilters,
    validateAndBuildParams,
    getOperatorsForAttribute,
  };
};
