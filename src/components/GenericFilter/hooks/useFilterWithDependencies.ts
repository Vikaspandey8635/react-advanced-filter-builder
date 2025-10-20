import { useState, useCallback, useEffect } from "react";
import { FilterCondition, AttributeOption, FilterParams } from "../types";
import { useFilterLogic } from "./useFilterLogic";
import { executeFetchOptions } from "../fetchHelpers";

export const useFilterWithDependencies = (
  attributeOptions: AttributeOption[],
  initialFilters?: FilterParams,
  defaultConditionsCount: number = 3,
  axiosInstance?: any
) => {
  const baseHook = useFilterLogic(
    attributeOptions,
    initialFilters,
    defaultConditionsCount
  );

  const [dependentOptions, setDependentOptions] = useState<
    Record<string, any[]>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const getDependencyValues = useCallback(
    (attribute: string): Record<string, any> => {
      const attributeOption = attributeOptions.find(
        (opt) => opt.value === attribute
      );
      if (!attributeOption?.dependsOn) return {};

      const dependencyValues: Record<string, any> = {};
      attributeOption.dependsOn.forEach((depAttr) => {
        const condition = baseHook.conditions.find(
          (c) => c.attribute === depAttr
        );
        if (condition?.value) {
          dependencyValues[depAttr] = condition.value;
        }
      });

      return dependencyValues;
    },
    [attributeOptions, baseHook.conditions]
  );

  const areDependenciesSatisfied = useCallback(
    (attribute: string): boolean => {
      const attributeOption = attributeOptions.find(
        (opt) => opt.value === attribute
      );
      if (
        !attributeOption?.dependsOn ||
        attributeOption.dependsOn.length === 0
      ) {
        return true;
      }

      return attributeOption.dependsOn.every((depAttr) => {
        const condition = baseHook.conditions.find(
          (c) => c.attribute === depAttr
        );
        return condition?.value && condition.value !== "";
      });
    },
    [attributeOptions, baseHook.conditions]
  );

  const fetchDependentOptions = useCallback(
    async (attribute: string) => {
      const attributeOption = attributeOptions.find(
        (opt) => opt.value === attribute
      );

      if (!attributeOption?.fetchOptions) return;

      if (!areDependenciesSatisfied(attribute)) {
        setDependentOptions((prev) => ({ ...prev, [attribute]: [] }));
        return;
      }

      const dependencyValues = getDependencyValues(attribute);

      setLoadingStates((prev) => ({ ...prev, [attribute]: true }));

      try {
        const options = await executeFetchOptions(
          attributeOption.fetchOptions,
          dependencyValues,
          axiosInstance
        );
        setDependentOptions((prev) => ({ ...prev, [attribute]: options }));
      } catch (error) {
        console.error(`Failed to fetch options for ${attribute}:`, error);
        setDependentOptions((prev) => ({ ...prev, [attribute]: [] }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, [attribute]: false }));
      }
    },
    [
      attributeOptions,
      areDependenciesSatisfied,
      getDependencyValues,
      axiosInstance,
    ]
  );

  const getDependentAttributes = useCallback(
    (changedAttribute: string): AttributeOption[] => {
      return attributeOptions.filter((opt) =>
        opt.dependsOn?.includes(changedAttribute)
      );
    },
    [attributeOptions]
  );

  const clearDependentValues = useCallback(
    (changedAttribute: string) => {
      const dependents = getDependentAttributes(changedAttribute);

      dependents.forEach((depAttr) => {
        if (depAttr.clearOnDependencyChange !== false) {
          baseHook.conditions.forEach((cond) => {
            if (cond.attribute === depAttr.value) {
              baseHook.updateCondition(cond.id, "value", "");
            }
          });

          clearDependentValues(depAttr.value);
        }
      });
    },
    [getDependentAttributes, baseHook]
  );

  const updateConditionWithDependencies = useCallback(
    (id: string, field: keyof FilterCondition, value: any) => {
      const condition = baseHook.conditions.find((c) => c.id === id);
      if (!condition) return;

      baseHook.updateCondition(id, field, value);

      if (field === "attribute" || field === "value") {
        const changedAttribute =
          field === "attribute" ? value : condition.attribute;

        if (changedAttribute) {
          clearDependentValues(changedAttribute);
          const dependentAttributes = getDependentAttributes(changedAttribute);
          dependentAttributes.forEach((depAttr) => {
            fetchDependentOptions(depAttr.value);
          });
        }
      }
    },
    [
      baseHook,
      clearDependentValues,
      getDependentAttributes,
      fetchDependentOptions,
    ]
  );

  useEffect(() => {
    const loadInitialOptions = async () => {
      for (const option of attributeOptions) {
        if (
          option.fetchOptions &&
          (!option.dependsOn || option.dependsOn.length === 0)
        ) {
          setLoadingStates((prev) => ({ ...prev, [option.value]: true }));
          try {
            const options = await executeFetchOptions(
              option.fetchOptions,
              undefined,
              axiosInstance
            );
            setDependentOptions((prev) => ({
              ...prev,
              [option.value]: options,
            }));
          } catch (error) {
            console.error(
              `Failed to load initial options for ${option.value}:`,
              error
            );
          } finally {
            setLoadingStates((prev) => ({ ...prev, [option.value]: false }));
          }
        }
      }
    };

    loadInitialOptions();
  }, [attributeOptions, axiosInstance]);

  useEffect(() => {
    baseHook.conditions.forEach((condition) => {
      if (condition.attribute) {
        const attributeOption = attributeOptions.find(
          (opt) => opt.value === condition.attribute
        );
        if (
          attributeOption?.dependsOn &&
          attributeOption.dependsOn.length > 0
        ) {
          fetchDependentOptions(condition.attribute);
        }
      }
    });
  }, [baseHook.conditions, fetchDependentOptions, attributeOptions]);

  return {
    ...baseHook,
    updateCondition: updateConditionWithDependencies,
    dependentOptions,
    loadingStates,
    areDependenciesSatisfied,
  };
};
