"use client";

import React, { useRef } from "react";
import { GenericFilterProps, FilterCondition } from "./types";
import { useFilterWithDependencies } from "./hooks/useFilterWithDependencies";
import Select from "react-select";
import { Trash2, X } from "lucide-react";

export const GenericFilter: React.FC<GenericFilterProps> = ({
  attributeOptions,
  onApply,
  onCancel,
  initialFilters,
  isOpen = true,
  showArchive = true,
  maxConditions = 10,
  defaultConditionsCount = 3,
  axiosInstance,
  className = "",
}) => {
  const {
    conditions,
    archive,
    error,
    setArchive,
    setError,
    addCondition,
    removeCondition,
    updateCondition,
    resetFilters,
    validateAndBuildParams,
    getOperatorsForAttribute,
    dependentOptions,
    loadingStates,
    areDependenciesSatisfied,
  } = useFilterWithDependencies(
    attributeOptions,
    initialFilters,
    defaultConditionsCount,
    axiosInstance
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleApplyFilter = () => {
    const { valid, params, error: validationError } = validateAndBuildParams();

    if (!valid) {
      setError(validationError || "");
      return;
    }

    onApply(params!);
    setError("");
  };

  const handleResetFilter = () => {
    resetFilters();
  };

  const getOptionsForAttribute = (attribute: string) => {
    const attributeOption = attributeOptions.find(
      (opt) => opt.value === attribute
    );

    if (!attributeOption) return [];

    if (attributeOption.dependsOn || attributeOption.fetchOptions) {
      return dependentOptions[attribute] || [];
    }

    return attributeOption.options || [];
  };

  const renderValueInput = (condition: FilterCondition) => {
    const attributeOption = attributeOptions.find(
      (opt) => opt.value === condition.attribute
    );
    const attributeType = attributeOption?.type;

    if (attributeType === "Select" || attributeType === "DropDown") {
      const options = getOptionsForAttribute(condition.attribute);
      const isLoading = loadingStates[condition.attribute];
      const dependenciesSatisfied = areDependenciesSatisfied(
        condition.attribute
      );

      const selectedOption =
        options.find((opt: any) => opt.value === condition.value) || null;

      return (
        <Select
          options={options}
          value={selectedOption}
          onChange={(selected: any) => {
            updateCondition(condition.id, "value", selected?.value || "");
            setError("");
          }}
          placeholder={
            isLoading
              ? "Loading..."
              : !dependenciesSatisfied
              ? "Select dependencies first"
              : "Select..."
          }
          isDisabled={!dependenciesSatisfied || isLoading}
          isLoading={isLoading}
          isClearable
          styles={{
            control: (base) => ({
              ...base,
              minHeight: "38px",
              borderColor: "#d1d5db",
            }),
          }}
        />
      );
    }

    if (attributeType === "Number") {
      return (
        <input
          type="number"
          value={
            typeof condition.value === "number" ||
            typeof condition.value === "string"
              ? condition.value
              : ""
          }
          onChange={(e) => {
            updateCondition(condition.id, "value", e.target.value);
            setError("");
          }}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter value..."
        />
      );
    }

    return (
      <input
        type="text"
        value={typeof condition.value === "string" ? condition.value : ""}
        onChange={(e) => {
          updateCondition(condition.id, "value", e.target.value);
          setError("");
        }}
        className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter value..."
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className={`relative bg-white p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center text-gray-700 w-full mb-4">
        <div className="text-lg font-semibold">Filter Options</div>
        <button
          onClick={() => {
            onCancel();
            setError("");
          }}
          className="cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors"
          aria-label="Close filter"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 text-gray-700 mt-7">
        <div
          ref={containerRef}
          className="grid grid-cols-4 gap-2 overflow-auto max-h-[40vh]"
        >
          <div className="font-medium text-sm sticky top-0 bg-white z-10 pb-2">
            Attribute
          </div>
          <div className="font-medium text-sm sticky top-0 bg-white z-10 pb-2">
            Operator
          </div>
          <div className="col-span-2 font-medium text-sm sticky top-0 bg-white z-10 pb-2">
            Value
          </div>

          <div className="col-span-4">
            {conditions.map((condition) => {
              const availableAttributeOptions = attributeOptions.filter(
                (option) =>
                  option?.value === condition.attribute ||
                  !conditions.some(
                    (c) => c.id !== condition.id && c.attribute === option.value
                  )
              );

              const attributeValue = attributeOptions?.find(
                (opt) => opt.value === condition.attribute
              );

              return (
                <div
                  key={condition.id}
                  className="grid grid-cols-4 gap-2 items-center pb-2"
                >
                  <div>
                    <Select
                      options={availableAttributeOptions}
                      value={attributeValue || null}
                      onChange={(selected: any) => {
                        updateCondition(
                          condition.id,
                          "attribute",
                          selected?.value || ""
                        );
                        setError("");
                      }}
                      isClearable
                      placeholder="Select attribute..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "38px",
                          borderColor: "#d1d5db",
                        }),
                      }}
                    />
                  </div>

                  <div>
                    <Select
                      options={getOperatorsForAttribute(condition.attribute)}
                      value={
                        getOperatorsForAttribute(condition.attribute).find(
                          (opt) => opt.value === condition.operator
                        ) || null
                      }
                      onChange={(selected: any) => {
                        updateCondition(
                          condition.id,
                          "operator",
                          selected?.value || ""
                        );
                        setError("");
                      }}
                      placeholder="Select operator..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "38px",
                          borderColor: "#d1d5db",
                        }),
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <div className="flex-1">{renderValueInput(condition)}</div>
                    {conditions.length > 1 && (
                      <button
                        onClick={() => removeCondition(condition.id)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Remove condition"
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {conditions.length < maxConditions && (
          <button
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
            onClick={addCondition}
          >
            + Add Attribute
          </button>
        )}

        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}

        <div className="flex justify-between gap-2 pt-4 border-t mt-4">
          {showArchive && (
            <div className="items-center flex gap-2 whitespace-nowrap">
              <input
                type="checkbox"
                id="archived"
                onChange={(e) => setArchive(e.target.checked)}
                checked={archive}
                className="rounded cursor-pointer"
              />
              <label
                className="text-gray-600 cursor-pointer"
                htmlFor="archived"
              >
                Show Archived
              </label>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              onClick={() => {
                onCancel();
                setError("");
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              onClick={handleResetFilter}
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericFilter;
