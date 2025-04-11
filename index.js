// src/index.ts
import { is as is6 } from "drizzle-orm";
import { MySqlDatabase as MySqlDatabase2 } from "drizzle-orm/mysql-core";
import { PgDatabase as PgDatabase2 } from "drizzle-orm/pg-core";
import { BaseSQLiteDatabase as BaseSQLiteDatabase2 } from "drizzle-orm/sqlite-core";
import {
  GraphQLObjectType as GraphQLObjectType6,
  GraphQLSchema
} from "graphql";

// src/util/builders/mysql.ts
import { createTableRelationsHelpers, is as is3, Relations } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";
import {
  GraphQLBoolean as GraphQLBoolean3,
  GraphQLError as GraphQLError3,
  GraphQLInt as GraphQLInt3,
  GraphQLList as GraphQLList3,
  GraphQLNonNull as GraphQLNonNull3,
  GraphQLObjectType as GraphQLObjectType3
} from "graphql";

// src/util/builders/common.ts
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns as getTableColumns2,
  gt,
  gte,
  ilike,
  inArray,
  is as is2,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  notIlike,
  notInArray,
  notLike,
  One,
  or
} from "drizzle-orm";
import {
  GraphQLBoolean as GraphQLBoolean2,
  GraphQLEnumType as GraphQLEnumType2,
  GraphQLError as GraphQLError2,
  GraphQLInputObjectType as GraphQLInputObjectType2,
  GraphQLInt as GraphQLInt2,
  GraphQLList as GraphQLList2,
  GraphQLNonNull as GraphQLNonNull2,
  GraphQLObjectType as GraphQLObjectType2,
  GraphQLString as GraphQLString2
} from "graphql";

// src/util/case-ops/index.ts
var uncapitalize = (input) => input.length ? `${input[0].toLocaleLowerCase()}${input.length > 1 ? input.slice(1, input.length) : ""}` : input;
var capitalize = (input) => input.length ? `${input[0].toLocaleUpperCase()}${input.length > 1 ? input.slice(1, input.length) : ""}` : input;

// src/util/data-mappers/index.ts
import { getTableColumns } from "drizzle-orm";
import { GraphQLError } from "graphql";
var remapToGraphQLCore = (key, value, tableName, column, relationMap) => {
  if (value instanceof Date)
    return value.toISOString();
  if (value instanceof Buffer)
    return Array.from(value);
  if (typeof value === "bigint")
    return value.toString();
  if (Array.isArray(value)) {
    const relations = relationMap?.[tableName];
    if (relations?.[key]) {
      return remapToGraphQLArrayOutput(
        value,
        relations[key].targetTableName,
        relations[key].relation.referencedTable,
        relationMap
      );
    }
    if (column.columnType === "PgGeometry" || column.columnType === "PgVector")
      return value;
    return value.map((arrVal) => remapToGraphQLCore(key, arrVal, tableName, column, relationMap));
  }
  if (typeof value === "object") {
    const relations = relationMap?.[tableName];
    if (relations?.[key]) {
      return remapToGraphQLSingleOutput(
        value,
        relations[key].targetTableName,
        relations[key].relation.referencedTable,
        relationMap
      );
    }
    if (column.columnType === "PgGeometryObject" || column.columnType === "PgJsonb") {
      return value;
    }
    return JSON.stringify(value);
  }
  return value;
};
var remapToGraphQLSingleOutput = (queryOutput, tableName, table, relationMap) => {
  for (const [key, value] of Object.entries(queryOutput)) {
    if (value === void 0 || value === null) {
      delete queryOutput[key];
    } else {
      queryOutput[key] = remapToGraphQLCore(key, value, tableName, table[key], relationMap);
    }
  }
  return queryOutput;
};
var remapToGraphQLArrayOutput = (queryOutput, tableName, table, relationMap) => {
  for (const entry of queryOutput) {
    remapToGraphQLSingleOutput(entry, tableName, table, relationMap);
  }
  return queryOutput;
};
var remapFromGraphQLCore = (value, column, columnName) => {
  switch (column.dataType) {
    case "date": {
      const formatted = new Date(value);
      if (Number.isNaN(formatted.getTime()))
        throw new GraphQLError(`Field '${columnName}' is not a valid date!`);
      return formatted;
    }
    case "buffer": {
      if (!Array.isArray(value)) {
        throw new GraphQLError(`Field '${columnName}' is not an array!`);
      }
      return Buffer.from(value);
    }
    case "json": {
      if (column.columnType === "PgGeometryObject")
        return value;
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new GraphQLError(
          `Invalid JSON in field '${columnName}':
${e instanceof Error ? e.message : "Unknown error"}`
        );
      }
    }
    case "array": {
      if (!Array.isArray(value)) {
        throw new GraphQLError(`Field '${columnName}' is not an array!`);
      }
      if (column.columnType === "PgGeometry" && value.length !== 2) {
        throw new GraphQLError(
          `Invalid float tuple in field '${columnName}': expected array with length of 2, received ${value.length}`
        );
      }
      return value;
    }
    case "bigint": {
      try {
        return BigInt(value);
      } catch (error) {
        throw new GraphQLError(`Field '${columnName}' is not a BigInt!`);
      }
    }
    default: {
      return value;
    }
  }
};
var remapFromGraphQLSingleInput = (queryInput, table) => {
  for (const [key, value] of Object.entries(queryInput)) {
    if (value === void 0) {
      delete queryInput[key];
    } else {
      const column = getTableColumns(table)[key];
      if (!column)
        throw new GraphQLError(`Unknown column: ${key}`);
      if (value === null && column.notNull) {
        delete queryInput[key];
        continue;
      }
      queryInput[key] = remapFromGraphQLCore(value, column, key);
    }
  }
  return queryInput;
};
var remapFromGraphQLArrayInput = (queryInput, table) => {
  for (const entry of queryInput)
    remapFromGraphQLSingleInput(entry, table);
  return queryInput;
};

// src/util/type-converter/index.ts
import { is } from "drizzle-orm";
import { MySqlInt, MySqlSerial } from "drizzle-orm/mysql-core";
import { PgInteger, PgSerial } from "drizzle-orm/pg-core";
import { SQLiteInteger } from "drizzle-orm/sqlite-core";
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from "graphql";

// src/util/type-converter/GraphQLJson.ts
import { GraphQLScalarType, Kind } from "graphql";
var GraphQLJson = new GraphQLScalarType({
  name: "JSON",
  description: "The JSON scalar type represents JSON values as scalars.",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  }
});

// src/util/type-converter/index.ts
var allowedNameChars = /^[a-zA-Z0-9_]+$/;
var enumMap = /* @__PURE__ */ new WeakMap();
var generateEnumCached = (column, columnName, tableName) => {
  if (enumMap.has(column))
    return enumMap.get(column);
  const gqlEnum = new GraphQLEnumType({
    name: `${capitalize(tableName)}${capitalize(columnName)}Enum`,
    values: Object.fromEntries(column.enumValues.map((e, index) => [allowedNameChars.test(e) ? e : `Option${index}`, {
      value: e,
      description: `Value: ${e}`
    }]))
  });
  enumMap.set(column, gqlEnum);
  return gqlEnum;
};
var geoXyType = new GraphQLObjectType({
  name: "PgGeometryObject",
  fields: {
    x: { type: GraphQLFloat },
    y: { type: GraphQLFloat }
  }
});
var geoXyInputType = new GraphQLInputObjectType({
  name: "PgGeometryObjectInput",
  fields: {
    x: { type: GraphQLFloat },
    y: { type: GraphQLFloat }
  }
});
var columnToGraphQLCore = (column, columnName, tableName, isInput) => {
  switch (column.dataType) {
    case "boolean":
      return { type: GraphQLBoolean, description: "Boolean" };
    case "json":
      return column.columnType === "PgGeometryObject" ? {
        type: isInput ? geoXyInputType : geoXyType,
        description: "Geometry points XY"
      } : { type: GraphQLJson, description: "JSON" };
    case "date":
      return { type: GraphQLString, description: "Date" };
    case "string":
      if (column.enumValues?.length)
        return { type: generateEnumCached(column, columnName, tableName) };
      return { type: GraphQLString, description: "String" };
    case "bigint":
      return { type: GraphQLString, description: "BigInt" };
    case "number":
      return is(column, PgInteger) || is(column, PgSerial) || is(column, MySqlInt) || is(column, MySqlSerial) || is(column, SQLiteInteger) ? { type: GraphQLInt, description: "Integer" } : { type: GraphQLFloat, description: "Float" };
    case "buffer":
      return { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)), description: "Buffer" };
    case "array": {
      if (column.columnType === "PgVector") {
        return {
          type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)),
          description: "Array<Float>"
        };
      }
      if (column.columnType === "PgGeometry") {
        return {
          type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)),
          description: "Tuple<[Float, Float]>"
        };
      }
      const innerType = columnToGraphQLCore(
        column.baseColumn,
        columnName,
        tableName,
        isInput
      );
      return {
        type: new GraphQLList(new GraphQLNonNull(innerType.type)),
        description: `Array<${innerType.description}>`
      };
    }
    case "custom":
      switch (column.sqlName) {
        case "tsvector":
          return { type: GraphQLString, description: "String" };
      }
    default:
      throw new Error(`Drizzle-GraphQL Error: Type ${column.dataType} is not implemented!`);
  }
};
var drizzleColumnToGraphQLType = (column, columnName, tableName, forceNullable = false, defaultIsNullable = false, isInput = false) => {
  const typeDesc = columnToGraphQLCore(column, columnName, tableName, isInput);
  const noDesc = ["string", "boolean", "number"];
  if (noDesc.find((e) => e === column.dataType))
    delete typeDesc.description;
  if (forceNullable)
    return typeDesc;
  if (column.notNull && !(defaultIsNullable && (column.hasDefault || column.defaultFn))) {
    return {
      type: new GraphQLNonNull(typeDesc.type),
      description: typeDesc.description
    };
  }
  return typeDesc;
};

// src/util/builders/common.ts
var rqbCrashTypes = [
  "SQLiteBigInt",
  "SQLiteBlobJson",
  "SQLiteBlobBuffer"
];
var extractSelectedColumnsFromTree = (tree, table) => {
  const tableColumns = getTableColumns2(table);
  const treeEntries = Object.entries(tree);
  const selectedColumns = [];
  for (const [fieldName, fieldData] of treeEntries) {
    if (!tableColumns[fieldData.name])
      continue;
    selectedColumns.push([fieldData.name, true]);
  }
  if (!selectedColumns.length) {
    const columnKeys = Object.entries(tableColumns);
    const columnName = columnKeys.find((e) => rqbCrashTypes.find((haram) => e[1].columnType !== haram))?.[0] ?? columnKeys[0][0];
    selectedColumns.push([columnName, true]);
  }
  return Object.fromEntries(selectedColumns);
};
var extractSelectedColumnsFromTreeSQLFormat = (tree, table) => {
  const tableColumns = getTableColumns2(table);
  const treeEntries = Object.entries(tree);
  const selectedColumns = [];
  for (const [fieldName, fieldData] of treeEntries) {
    if (!tableColumns[fieldData.name])
      continue;
    selectedColumns.push([fieldData.name, tableColumns[fieldData.name]]);
  }
  if (!selectedColumns.length) {
    const columnKeys = Object.entries(tableColumns);
    const columnName = columnKeys.find((e) => rqbCrashTypes.find((haram) => e[1].columnType !== haram))?.[0] ?? columnKeys[0][0];
    selectedColumns.push([columnName, tableColumns[columnName]]);
  }
  return Object.fromEntries(selectedColumns);
};
var innerOrder = new GraphQLInputObjectType2({
  name: "InnerOrder",
  fields: {
    direction: {
      type: new GraphQLNonNull2(
        new GraphQLEnumType2({
          name: "OrderDirection",
          description: "Order by direction",
          values: {
            asc: {
              value: "asc",
              description: "Ascending order"
            },
            desc: {
              value: "desc",
              description: "Descending order"
            }
          }
        })
      )
    },
    priority: { type: new GraphQLNonNull2(GraphQLInt2), description: "Priority of current field" }
  }
});
var generateColumnFilterValues = (column, tableName, columnName) => {
  const columnGraphQLType = drizzleColumnToGraphQLType(column, columnName, tableName, true, false, true);
  const columnArr = new GraphQLList2(new GraphQLNonNull2(columnGraphQLType.type));
  const baseFields = {
    eq: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    ne: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    lt: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    lte: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    gt: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    gte: { type: columnGraphQLType.type, description: columnGraphQLType.description },
    like: { type: GraphQLString2 },
    notLike: { type: GraphQLString2 },
    ilike: { type: GraphQLString2 },
    notIlike: { type: GraphQLString2 },
    inArray: { type: columnArr, description: `Array<${columnGraphQLType.description}>` },
    notInArray: { type: columnArr, description: `Array<${columnGraphQLType.description}>` },
    isNull: { type: GraphQLBoolean2 },
    isNotNull: { type: GraphQLBoolean2 }
  };
  const type = new GraphQLInputObjectType2({
    name: `${capitalize(tableName)}${capitalize(columnName)}Filters`,
    fields: {
      ...baseFields,
      OR: {
        type: new GraphQLList2(
          new GraphQLNonNull2(
            new GraphQLInputObjectType2({
              name: `${capitalize(tableName)}${capitalize(columnName)}filtersOr`,
              fields: {
                ...baseFields
              }
            })
          )
        )
      }
    }
  });
  return type;
};
var orderMap = /* @__PURE__ */ new WeakMap();
var generateTableOrderCached = (table) => {
  if (orderMap.has(table))
    return orderMap.get(table);
  const columns = getTableColumns2(table);
  const columnEntries = Object.entries(columns);
  const remapped = Object.fromEntries(
    columnEntries.map(([columnName, columnDescription]) => [columnName, { type: innerOrder }])
  );
  orderMap.set(table, remapped);
  return remapped;
};
var filterMap = /* @__PURE__ */ new WeakMap();
var generateTableFilterValuesCached = (table, tableName) => {
  if (filterMap.has(table))
    return filterMap.get(table);
  const columns = getTableColumns2(table);
  const columnEntries = Object.entries(columns);
  const remapped = Object.fromEntries(
    columnEntries.map(([columnName, columnDescription]) => [
      columnName,
      {
        type: generateColumnFilterValues(columnDescription, tableName, columnName)
      }
    ])
  );
  filterMap.set(table, remapped);
  return remapped;
};
var fieldMap = /* @__PURE__ */ new WeakMap();
var generateTableSelectTypeFieldsCached = (table, tableName) => {
  if (fieldMap.has(table))
    return fieldMap.get(table);
  const columns = getTableColumns2(table);
  const columnEntries = Object.entries(columns);
  const remapped = Object.fromEntries(
    columnEntries.map(([columnName, columnDescription]) => [
      columnName,
      drizzleColumnToGraphQLType(columnDescription, columnName, tableName)
    ])
  );
  fieldMap.set(table, remapped);
  return remapped;
};
var orderTypeMap = /* @__PURE__ */ new WeakMap();
var generateTableOrderTypeCached = (table, tableName) => {
  if (orderTypeMap.has(table))
    return orderTypeMap.get(table);
  const orderColumns = generateTableOrderCached(table);
  const order = new GraphQLInputObjectType2({
    name: `${capitalize(tableName)}OrderBy`,
    fields: orderColumns
  });
  orderTypeMap.set(table, order);
  return order;
};
var filterTypeMap = /* @__PURE__ */ new WeakMap();
var generateTableFilterTypeCached = (table, tableName) => {
  if (filterTypeMap.has(table))
    return filterTypeMap.get(table);
  const filterColumns = generateTableFilterValuesCached(table, tableName);
  const filters = new GraphQLInputObjectType2({
    name: `${capitalize(tableName)}Filters`,
    fields: {
      ...filterColumns,
      OR: {
        type: new GraphQLList2(
          new GraphQLNonNull2(
            new GraphQLInputObjectType2({
              name: `${capitalize(tableName)}FiltersOr`,
              fields: filterColumns
            })
          )
        )
      }
    }
  });
  filterTypeMap.set(table, filters);
  return filters;
};
var generateSelectFields = (tables, tableName, relationMap, typeName, withOrder, relationsDepthLimit, currentDepth = 0, usedTables = /* @__PURE__ */ new Set()) => {
  const relations = relationMap[tableName];
  const relationEntries = relations ? Object.entries(relations) : [];
  const table = tables[tableName];
  const order = withOrder ? generateTableOrderTypeCached(table, tableName) : void 0;
  const filters = generateTableFilterTypeCached(table, tableName);
  const tableFields = generateTableSelectTypeFieldsCached(table, tableName);
  if (usedTables.has(tableName) || typeof relationsDepthLimit === "number" && currentDepth >= relationsDepthLimit || !relationEntries.length) {
    return {
      order,
      filters,
      tableFields,
      relationFields: {}
    };
  }
  const rawRelationFields = [];
  const updatedUsedTables = new Set(usedTables).add(tableName);
  const newDepth = currentDepth + 1;
  for (const [relationName, { targetTableName, relation }] of relationEntries) {
    const relTypeName = `${typeName}${capitalize(relationName)}Relation`;
    const isOne = is2(relation, One);
    const relData = generateSelectFields(
      tables,
      targetTableName,
      relationMap,
      relTypeName,
      !isOne,
      relationsDepthLimit,
      newDepth,
      updatedUsedTables
    );
    const relType = new GraphQLObjectType2({
      name: relTypeName,
      fields: { ...relData.tableFields, ...relData.relationFields }
    });
    if (isOne) {
      rawRelationFields.push([
        relationName,
        {
          type: relType,
          args: {
            where: { type: relData.filters }
          }
        }
      ]);
      continue;
    }
    rawRelationFields.push([
      relationName,
      {
        type: new GraphQLNonNull2(new GraphQLList2(new GraphQLNonNull2(relType))),
        args: {
          where: { type: relData.filters },
          orderBy: { type: relData.order },
          offset: { type: GraphQLInt2 },
          limit: { type: GraphQLInt2 }
        }
      }
    ]);
  }
  const relationFields = Object.fromEntries(rawRelationFields);
  return { order, filters, tableFields, relationFields };
};
var generateTableTypes = (tableName, tables, relationMap, withReturning, relationsDepthLimit) => {
  const stylizedName = capitalize(tableName);
  const { tableFields, relationFields, filters, order } = generateSelectFields(
    tables,
    tableName,
    relationMap,
    stylizedName,
    true,
    relationsDepthLimit
  );
  const table = tables[tableName];
  const columns = getTableColumns2(table);
  const columnEntries = Object.entries(columns);
  const insertFields = Object.fromEntries(
    columnEntries.map(([columnName, columnDescription]) => [
      columnName,
      drizzleColumnToGraphQLType(columnDescription, columnName, tableName, false, true, true)
    ])
  );
  const updateFields = Object.fromEntries(
    columnEntries.map(([columnName, columnDescription]) => [
      columnName,
      drizzleColumnToGraphQLType(columnDescription, columnName, tableName, true, false, true)
    ])
  );
  const insertInput = new GraphQLInputObjectType2({
    name: `${stylizedName}InsertInput`,
    fields: insertFields
  });
  const selectSingleOutput = new GraphQLObjectType2({
    name: `${stylizedName}SelectItem`,
    fields: { ...tableFields, ...relationFields }
  });
  const selectArrOutput = new GraphQLNonNull2(new GraphQLList2(new GraphQLNonNull2(selectSingleOutput)));
  const singleTableItemOutput = withReturning ? new GraphQLObjectType2({
    name: `${stylizedName}Item`,
    fields: tableFields
  }) : void 0;
  const arrTableItemOutput = withReturning ? new GraphQLNonNull2(new GraphQLList2(new GraphQLNonNull2(singleTableItemOutput))) : void 0;
  const updateInput = new GraphQLInputObjectType2({
    name: `${stylizedName}UpdateInput`,
    fields: updateFields
  });
  const inputs = {
    insertInput,
    updateInput,
    tableOrder: order,
    tableFilters: filters
  };
  const outputs = withReturning ? {
    selectSingleOutput,
    selectArrOutput,
    singleTableItemOutput,
    arrTableItemOutput
  } : {
    selectSingleOutput,
    selectArrOutput
  };
  return {
    inputs,
    outputs
  };
};
var extractOrderBy = (table, orderArgs) => {
  const res = [];
  for (const [column, config] of Object.entries(orderArgs).sort(
    (a, b) => (b[1]?.priority ?? 0) - (a[1]?.priority ?? 0)
  )) {
    if (!config)
      continue;
    const { direction } = config;
    res.push(direction === "asc" ? asc(getTableColumns2(table)[column]) : desc(getTableColumns2(table)[column]));
  }
  return res;
};
var extractFiltersColumn = (column, columnName, operators) => {
  if (!operators.OR?.length)
    delete operators.OR;
  const entries = Object.entries(operators);
  if (operators.OR) {
    if (entries.length > 1) {
      throw new GraphQLError2(`WHERE ${columnName}: Cannot specify both fields and 'OR' in column operators!`);
    }
    const variants2 = [];
    for (const variant of operators.OR) {
      const extracted = extractFiltersColumn(column, columnName, variant);
      if (extracted)
        variants2.push(extracted);
    }
    return variants2.length ? variants2.length > 1 ? or(...variants2) : variants2[0] : void 0;
  }
  const variants = [];
  for (const [operatorName, operatorValue] of entries) {
    if (operatorValue === null || operatorValue === false)
      continue;
    let operator;
    switch (operatorName) {
      case "eq":
        operator = operator ?? eq;
      case "ne":
        operator = operator ?? ne;
      case "gt":
        operator = operator ?? gt;
      case "gte":
        operator = operator ?? gte;
      case "lt":
        operator = operator ?? lt;
      case "lte":
        operator = operator ?? lte;
        const singleValue = remapFromGraphQLCore(operatorValue, column, columnName);
        variants.push(operator(column, singleValue));
        break;
      case "like":
        operator = operator ?? like;
      case "notLike":
        operator = operator ?? notLike;
      case "ilike":
        operator = operator ?? ilike;
      case "notIlike":
        operator = operator ?? notIlike;
        variants.push(operator(column, operatorValue));
        break;
      case "inArray":
        operator = operator ?? inArray;
      case "notInArray":
        operator = operator ?? notInArray;
        if (!operatorValue.length) {
          throw new GraphQLError2(
            `WHERE ${columnName}: Unable to use operator ${operatorName} with an empty array!`
          );
        }
        const arrayValue = operatorValue.map((val) => remapFromGraphQLCore(val, column, columnName));
        variants.push(operator(column, arrayValue));
        break;
      case "isNull":
        operator = operator ?? isNull;
      case "isNotNull":
        operator = operator ?? isNotNull;
        variants.push(operator(column));
    }
  }
  return variants.length ? variants.length > 1 ? and(...variants) : variants[0] : void 0;
};
var extractFilters = (table, tableName, filters) => {
  if (!filters.OR?.length)
    delete filters.OR;
  const entries = Object.entries(filters);
  if (!entries.length)
    return;
  if (filters.OR) {
    if (entries.length > 1) {
      throw new GraphQLError2(`WHERE ${tableName}: Cannot specify both fields and 'OR' in table filters!`);
    }
    const variants2 = [];
    for (const variant of filters.OR) {
      const extracted = extractFilters(table, tableName, variant);
      if (extracted)
        variants2.push(extracted);
    }
    return variants2.length ? variants2.length > 1 ? or(...variants2) : variants2[0] : void 0;
  }
  const variants = [];
  for (const [columnName, operators] of entries) {
    if (operators === null)
      continue;
    const column = getTableColumns2(table)[columnName];
    variants.push(extractFiltersColumn(column, columnName, operators));
  }
  return variants.length ? variants.length > 1 ? and(...variants) : variants[0] : void 0;
};
var extractRelationsParamsInner = (relationMap, tables, tableName, typeName, originField, isInitial = false) => {
  const relations = relationMap[tableName];
  if (!relations)
    return void 0;
  const baseField = Object.entries(originField.fieldsByTypeName).find(([key, value]) => key === typeName)?.[1];
  if (!baseField)
    return void 0;
  const args = {};
  for (const [relName, { targetTableName, relation }] of Object.entries(relations)) {
    const relTypeName = `${isInitial ? capitalize(tableName) : typeName}${capitalize(relName)}Relation`;
    const relFieldSelection = Object.values(baseField).find(
      (field) => field.name === relName
    )?.fieldsByTypeName[relTypeName];
    if (!relFieldSelection)
      continue;
    const columns = extractSelectedColumnsFromTree(relFieldSelection, tables[targetTableName]);
    const thisRecord = {};
    thisRecord.columns = columns;
    const relationField = Object.values(baseField).find((e) => e.name === relName);
    const relationArgs = relationField?.args;
    const orderBy = relationArgs?.orderBy ? extractOrderBy(tables[targetTableName], relationArgs.orderBy) : void 0;
    const where = relationArgs?.where ? extractFilters(tables[targetTableName], relName, relationArgs?.where) : void 0;
    const offset = relationArgs?.offset ?? void 0;
    const limit = relationArgs?.limit ?? void 0;
    thisRecord.orderBy = orderBy;
    thisRecord.where = where;
    thisRecord.offset = offset;
    thisRecord.limit = limit;
    const relWith = relationField ? extractRelationsParamsInner(relationMap, tables, targetTableName, relTypeName, relationField) : void 0;
    thisRecord.with = relWith;
    args[relName] = thisRecord;
  }
  return args;
};
var extractRelationsParams = (relationMap, tables, tableName, info, typeName) => {
  if (!info)
    return void 0;
  return extractRelationsParamsInner(relationMap, tables, tableName, typeName, info, true);
};

// src/util/builders/mysql.ts
import { parseResolveInfo } from "graphql-parse-resolve-info";
var generateSelectArray = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt3
    },
    limit: {
      type: GraphQLInt3
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, limit, orderBy, where } = args;
        const parsedInfo = parseResolveInfo(info, {
          deep: true
        });
        const query = queryBase.findMany({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          offset,
          limit,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSelectSingle = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}Single`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt3
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, orderBy, where } = args;
        const parsedInfo = parseResolveInfo(info, {
          deep: true
        });
        const query = queryBase.findFirst({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          offset,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        if (!result)
          return void 0;
        return remapToGraphQLSingleOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertArray = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull3(new GraphQLList3(new GraphQLNonNull3(baseType)))
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLArrayInput(args.values, table);
        if (!input.length)
          throw new GraphQLError3("No values were provided!");
        await db.insert(table).values(input);
        return { isSuccess: true };
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertSingle = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}Single`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull3(baseType)
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLSingleInput(args.values, table);
        await db.insert(table).values(input);
        return { isSuccess: true };
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateUpdate = (db, tableName, table, setArgs, filterArgs) => {
  const queryName = `update${capitalize(tableName)}`;
  const queryArgs = {
    set: {
      type: new GraphQLNonNull3(setArgs)
    },
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where, set } = args;
        const input = remapFromGraphQLSingleInput(set, table);
        if (!Object.keys(input).length)
          throw new GraphQLError3("Unable to update with no values specified!");
        let query = db.update(table).set(input);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        await query;
        return { isSuccess: true };
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateDelete = (db, tableName, table, filterArgs) => {
  const queryName = `deleteFrom${tableName}`;
  const queryArgs = {
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where } = args;
        let query = db.delete(table);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        await query;
        return { isSuccess: true };
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError3(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSchemaData = (db, schema, relationsDepthLimit) => {
  const rawSchema = schema;
  const schemaEntries = Object.entries(rawSchema);
  const tableEntries = schemaEntries.filter(([key, value]) => is3(value, MySqlTable));
  const tables = Object.fromEntries(tableEntries);
  if (!tableEntries.length) {
    throw new Error(
      "Drizzle-GraphQL Error: No tables detected in Drizzle-ORM's database instance. Did you forget to pass schema to drizzle constructor?"
    );
  }
  const rawRelations = schemaEntries.filter(([key, value]) => is3(value, Relations)).map(([key, value]) => [
    tableEntries.find(
      ([tableName, tableValue]) => tableValue === value.table
    )[0],
    value
  ]).map(([tableName, relValue]) => [
    tableName,
    relValue.config(createTableRelationsHelpers(tables[tableName]))
  ]);
  const namedRelations = Object.fromEntries(
    rawRelations.map(([relName, config]) => {
      const namedConfig = Object.fromEntries(
        Object.entries(config).map(([innerRelName, innerRelValue]) => [innerRelName, {
          relation: innerRelValue,
          targetTableName: tableEntries.find(
            ([tableName, tableValue]) => tableValue === innerRelValue.referencedTable
          )[0]
        }])
      );
      return [
        relName,
        namedConfig
      ];
    })
  );
  const queries = {};
  const mutations = {};
  const gqlSchemaTypes = Object.fromEntries(
    Object.entries(tables).map(([tableName, table]) => [
      tableName,
      generateTableTypes(tableName, tables, namedRelations, false, relationsDepthLimit)
    ])
  );
  const mutationReturnType = new GraphQLObjectType3({
    name: `MutationReturn`,
    fields: {
      isSuccess: {
        type: new GraphQLNonNull3(GraphQLBoolean3)
      }
    }
  });
  const inputs = {};
  const outputs = {
    MutationReturn: mutationReturnType
  };
  for (const [tableName, tableTypes] of Object.entries(gqlSchemaTypes)) {
    const { insertInput, updateInput, tableFilters, tableOrder } = tableTypes.inputs;
    const { selectSingleOutput, selectArrOutput } = tableTypes.outputs;
    const selectArrGenerated = generateSelectArray(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const selectSingleGenerated = generateSelectSingle(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const insertArrGenerated = generateInsertArray(db, tableName, schema[tableName], insertInput);
    const insertSingleGenerated = generateInsertSingle(db, tableName, schema[tableName], insertInput);
    const updateGenerated = generateUpdate(
      db,
      tableName,
      schema[tableName],
      updateInput,
      tableFilters
    );
    const deleteGenerated = generateDelete(db, tableName, schema[tableName], tableFilters);
    queries[selectArrGenerated.name] = {
      type: selectArrOutput,
      args: selectArrGenerated.args,
      resolve: selectArrGenerated.resolver
    };
    queries[selectSingleGenerated.name] = {
      type: selectSingleOutput,
      args: selectSingleGenerated.args,
      resolve: selectSingleGenerated.resolver
    };
    mutations[insertArrGenerated.name] = {
      type: mutationReturnType,
      args: insertArrGenerated.args,
      resolve: insertArrGenerated.resolver
    };
    mutations[insertSingleGenerated.name] = {
      type: mutationReturnType,
      args: insertSingleGenerated.args,
      resolve: insertSingleGenerated.resolver
    };
    mutations[updateGenerated.name] = {
      type: mutationReturnType,
      args: updateGenerated.args,
      resolve: updateGenerated.resolver
    };
    mutations[deleteGenerated.name] = {
      type: mutationReturnType,
      args: deleteGenerated.args,
      resolve: deleteGenerated.resolver
    };
    [insertInput, updateInput, tableFilters, tableOrder].forEach((e) => inputs[e.name] = e);
    outputs[selectSingleOutput.name] = selectSingleOutput;
  }
  return { queries, mutations, inputs, types: outputs };
};

// src/util/builders/pg.ts
import { createTableRelationsHelpers as createTableRelationsHelpers2, is as is4, Relations as Relations2 } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import {
  GraphQLError as GraphQLError4,
  GraphQLInt as GraphQLInt4,
  GraphQLList as GraphQLList4,
  GraphQLNonNull as GraphQLNonNull4
} from "graphql";
import { parseResolveInfo as parseResolveInfo2 } from "graphql-parse-resolve-info";
var generateSelectArray2 = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt4
    },
    limit: {
      type: GraphQLInt4
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, limit, orderBy, where } = args;
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const query = queryBase.findMany({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          /*extractSelectedColumnsFromNode(tableSelection, info.fragments, table) */
          offset,
          limit,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSelectSingle2 = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}Single`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt4
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, orderBy, where } = args;
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const query = queryBase.findFirst({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          offset,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        if (!result)
          return void 0;
        return remapToGraphQLSingleOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertArray2 = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull4(new GraphQLList4(new GraphQLNonNull4(baseType)))
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLArrayInput(args.values, table);
        if (!input.length)
          throw new GraphQLError4("No values were provided!");
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const result = await db.insert(table).values(input).returning(columns).onConflictDoNothing();
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertSingle2 = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}Single`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull4(baseType)
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLSingleInput(args.values, table);
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const result = await db.insert(table).values(input).returning(columns).onConflictDoNothing();
        if (!result[0])
          return void 0;
        return remapToGraphQLSingleOutput(result[0], tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateUpdate2 = (db, tableName, table, setArgs, filterArgs) => {
  const queryName = `update${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    set: {
      type: new GraphQLNonNull4(setArgs)
    },
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where, set } = args;
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const input = remapFromGraphQLSingleInput(set, table);
        if (!Object.keys(input).length)
          throw new GraphQLError4("Unable to update with no values specified!");
        let query = db.update(table).set(input);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        query = query.returning(columns);
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateDelete2 = (db, tableName, table, filterArgs) => {
  const queryName = `deleteFrom${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where } = args;
        const parsedInfo = parseResolveInfo2(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        let query = db.delete(table);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        query = query.returning(columns);
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError4(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSchemaData2 = (db, schema, relationsDepthLimit) => {
  const rawSchema = schema;
  const schemaEntries = Object.entries(rawSchema);
  const tableEntries = schemaEntries.filter(([key, value]) => is4(value, PgTable));
  const tables = Object.fromEntries(tableEntries);
  if (!tableEntries.length) {
    throw new Error(
      "Drizzle-GraphQL Error: No tables detected in Drizzle-ORM's database instance. Did you forget to pass schema to drizzle constructor?"
    );
  }
  const rawRelations = schemaEntries.filter(([key, value]) => is4(value, Relations2)).map(([key, value]) => [
    tableEntries.find(
      ([tableName, tableValue]) => tableValue === value.table
    )[0],
    value
  ]).map(([tableName, relValue]) => [
    tableName,
    relValue.config(createTableRelationsHelpers2(tables[tableName]))
  ]);
  const namedRelations = Object.fromEntries(
    rawRelations.map(([relName, config]) => {
      const namedConfig = Object.fromEntries(
        Object.entries(config).map(([innerRelName, innerRelValue]) => [innerRelName, {
          relation: innerRelValue,
          targetTableName: tableEntries.find(
            ([tableName, tableValue]) => tableValue === innerRelValue.referencedTable
          )[0]
        }])
      );
      return [
        relName,
        namedConfig
      ];
    })
  );
  const queries = {};
  const mutations = {};
  const gqlSchemaTypes = Object.fromEntries(
    Object.entries(tables).map(([tableName, table]) => [
      tableName,
      generateTableTypes(tableName, tables, namedRelations, true, relationsDepthLimit)
    ])
  );
  const inputs = {};
  const outputs = {};
  for (const [tableName, tableTypes] of Object.entries(gqlSchemaTypes)) {
    const { insertInput, updateInput, tableFilters, tableOrder } = tableTypes.inputs;
    const { selectSingleOutput, selectArrOutput, singleTableItemOutput, arrTableItemOutput } = tableTypes.outputs;
    const selectArrGenerated = generateSelectArray2(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const selectSingleGenerated = generateSelectSingle2(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const insertArrGenerated = generateInsertArray2(db, tableName, schema[tableName], insertInput);
    const insertSingleGenerated = generateInsertSingle2(db, tableName, schema[tableName], insertInput);
    const updateGenerated = generateUpdate2(db, tableName, schema[tableName], updateInput, tableFilters);
    const deleteGenerated = generateDelete2(db, tableName, schema[tableName], tableFilters);
    queries[selectArrGenerated.name] = {
      type: selectArrOutput,
      args: selectArrGenerated.args,
      resolve: selectArrGenerated.resolver
    };
    queries[selectSingleGenerated.name] = {
      type: selectSingleOutput,
      args: selectSingleGenerated.args,
      resolve: selectSingleGenerated.resolver
    };
    mutations[insertArrGenerated.name] = {
      type: arrTableItemOutput,
      args: insertArrGenerated.args,
      resolve: insertArrGenerated.resolver
    };
    mutations[insertSingleGenerated.name] = {
      type: singleTableItemOutput,
      args: insertSingleGenerated.args,
      resolve: insertSingleGenerated.resolver
    };
    mutations[updateGenerated.name] = {
      type: arrTableItemOutput,
      args: updateGenerated.args,
      resolve: updateGenerated.resolver
    };
    mutations[deleteGenerated.name] = {
      type: arrTableItemOutput,
      args: deleteGenerated.args,
      resolve: deleteGenerated.resolver
    };
    [insertInput, updateInput, tableFilters, tableOrder].forEach((e) => inputs[e.name] = e);
    outputs[selectSingleOutput.name] = selectSingleOutput;
    outputs[singleTableItemOutput.name] = singleTableItemOutput;
  }
  return { queries, mutations, inputs, types: outputs };
};

// src/util/builders/sqlite.ts
import { createTableRelationsHelpers as createTableRelationsHelpers3, is as is5, Relations as Relations3 } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import {
  GraphQLError as GraphQLError5,
  GraphQLInt as GraphQLInt5,
  GraphQLList as GraphQLList5,
  GraphQLNonNull as GraphQLNonNull5
} from "graphql";
import { parseResolveInfo as parseResolveInfo3 } from "graphql-parse-resolve-info";
var generateSelectArray3 = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt5
    },
    limit: {
      type: GraphQLInt5
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, limit, orderBy, where } = args;
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const query = queryBase.findMany({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          offset,
          limit,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSelectSingle3 = (db, tableName, tables, relationMap, orderArgs, filterArgs) => {
  const queryName = `${uncapitalize(tableName)}Single`;
  const queryBase = db.query[tableName];
  if (!queryBase) {
    throw new Error(
      `Drizzle-GraphQL Error: Table ${tableName} not found in drizzle instance. Did you forget to pass schema to drizzle constructor?`
    );
  }
  const queryArgs = {
    offset: {
      type: GraphQLInt5
    },
    orderBy: {
      type: orderArgs
    },
    where: {
      type: filterArgs
    }
  };
  const typeName = `${capitalize(tableName)}SelectItem`;
  const table = tables[tableName];
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { offset, orderBy, where } = args;
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const query = queryBase.findFirst({
          columns: extractSelectedColumnsFromTree(
            parsedInfo.fieldsByTypeName[typeName],
            table
          ),
          offset,
          orderBy: orderBy ? extractOrderBy(table, orderBy) : void 0,
          where: where ? extractFilters(table, tableName, where) : void 0,
          with: relationMap[tableName] ? extractRelationsParams(relationMap, tables, tableName, parsedInfo, typeName) : void 0
        });
        const result = await query;
        if (!result)
          return void 0;
        return remapToGraphQLSingleOutput(result, tableName, table, relationMap);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertArray3 = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull5(new GraphQLList5(new GraphQLNonNull5(baseType)))
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLArrayInput(args.values, table);
        if (!input.length)
          throw new GraphQLError5("No values were provided!");
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const result = await db.insert(table).values(input).returning(columns).onConflictDoNothing();
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateInsertSingle3 = (db, tableName, table, baseType) => {
  const queryName = `insertInto${capitalize(tableName)}Single`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    values: {
      type: new GraphQLNonNull5(baseType)
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const input = remapFromGraphQLSingleInput(args.values, table);
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const result = await db.insert(table).values(input).returning(columns).onConflictDoNothing();
        if (!result[0])
          return void 0;
        return remapToGraphQLSingleOutput(result[0], tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateUpdate3 = (db, tableName, table, setArgs, filterArgs) => {
  const queryName = `update${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    set: {
      type: new GraphQLNonNull5(setArgs)
    },
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where, set } = args;
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        const input = remapFromGraphQLSingleInput(set, table);
        if (!Object.keys(input).length)
          throw new GraphQLError5("Unable to update with no values specified!");
        let query = db.update(table).set(input);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        query = query.returning(columns);
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateDelete3 = (db, tableName, table, filterArgs) => {
  const queryName = `deleteFrom${capitalize(tableName)}`;
  const typeName = `${capitalize(tableName)}Item`;
  const queryArgs = {
    where: {
      type: filterArgs
    }
  };
  return {
    name: queryName,
    resolver: async (source, args, context, info) => {
      try {
        const { where } = args;
        const parsedInfo = parseResolveInfo3(info, {
          deep: true
        });
        const columns = extractSelectedColumnsFromTreeSQLFormat(
          parsedInfo.fieldsByTypeName[typeName],
          table
        );
        let query = db.delete(table);
        if (where) {
          const filters = extractFilters(table, tableName, where);
          query = query.where(filters);
        }
        query = query.returning(columns);
        const result = await query;
        return remapToGraphQLArrayOutput(result, tableName, table);
      } catch (e) {
        if (typeof e === "object" && typeof e.message === "string") {
          throw new GraphQLError5(e.message);
        }
        throw e;
      }
    },
    args: queryArgs
  };
};
var generateSchemaData3 = (db, schema, relationsDepthLimit) => {
  const rawSchema = schema;
  const schemaEntries = Object.entries(rawSchema);
  const tableEntries = schemaEntries.filter(([key, value]) => is5(value, SQLiteTable));
  const tables = Object.fromEntries(tableEntries);
  if (!tableEntries.length) {
    throw new Error(
      "Drizzle-GraphQL Error: No tables detected in Drizzle-ORM's database instance. Did you forget to pass schema to drizzle constructor?"
    );
  }
  const rawRelations = schemaEntries.filter(([key, value]) => is5(value, Relations3)).map(([key, value]) => [
    tableEntries.find(
      ([tableName, tableValue]) => tableValue === value.table
    )[0],
    value
  ]).map(([tableName, relValue]) => [
    tableName,
    relValue.config(createTableRelationsHelpers3(tables[tableName]))
  ]);
  const namedRelations = Object.fromEntries(
    rawRelations.map(([relName, config]) => {
      const namedConfig = Object.fromEntries(
        Object.entries(config).map(([innerRelName, innerRelValue]) => [innerRelName, {
          relation: innerRelValue,
          targetTableName: tableEntries.find(
            ([tableName, tableValue]) => tableValue === innerRelValue.referencedTable
          )[0]
        }])
      );
      return [
        relName,
        namedConfig
      ];
    })
  );
  const queries = {};
  const mutations = {};
  const gqlSchemaTypes = Object.fromEntries(
    Object.entries(tables).map(([tableName, table]) => [
      tableName,
      generateTableTypes(tableName, tables, namedRelations, true, relationsDepthLimit)
    ])
  );
  const inputs = {};
  const outputs = {};
  for (const [tableName, tableTypes] of Object.entries(gqlSchemaTypes)) {
    const { insertInput, updateInput, tableFilters, tableOrder } = tableTypes.inputs;
    const { selectSingleOutput, selectArrOutput, singleTableItemOutput, arrTableItemOutput } = tableTypes.outputs;
    const selectArrGenerated = generateSelectArray3(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const selectSingleGenerated = generateSelectSingle3(
      db,
      tableName,
      tables,
      namedRelations,
      tableOrder,
      tableFilters
    );
    const insertArrGenerated = generateInsertArray3(db, tableName, schema[tableName], insertInput);
    const insertSingleGenerated = generateInsertSingle3(db, tableName, schema[tableName], insertInput);
    const updateGenerated = generateUpdate3(
      db,
      tableName,
      schema[tableName],
      updateInput,
      tableFilters
    );
    const deleteGenerated = generateDelete3(db, tableName, schema[tableName], tableFilters);
    queries[selectArrGenerated.name] = {
      type: selectArrOutput,
      args: selectArrGenerated.args,
      resolve: selectArrGenerated.resolver
    };
    queries[selectSingleGenerated.name] = {
      type: selectSingleOutput,
      args: selectSingleGenerated.args,
      resolve: selectSingleGenerated.resolver
    };
    mutations[insertArrGenerated.name] = {
      type: arrTableItemOutput,
      args: insertArrGenerated.args,
      resolve: insertArrGenerated.resolver
    };
    mutations[insertSingleGenerated.name] = {
      type: singleTableItemOutput,
      args: insertSingleGenerated.args,
      resolve: insertSingleGenerated.resolver
    };
    mutations[updateGenerated.name] = {
      type: arrTableItemOutput,
      args: updateGenerated.args,
      resolve: updateGenerated.resolver
    };
    mutations[deleteGenerated.name] = {
      type: arrTableItemOutput,
      args: deleteGenerated.args,
      resolve: deleteGenerated.resolver
    };
    [insertInput, updateInput, tableFilters, tableOrder].forEach((e) => inputs[e.name] = e);
    outputs[selectSingleOutput.name] = selectSingleOutput;
    outputs[singleTableItemOutput.name] = singleTableItemOutput;
  }
  return { queries, mutations, inputs, types: outputs };
};

// src/index.ts
var buildSchema = (db, config) => {
  const schema = db._.fullSchema;
  if (!schema) {
    throw new Error(
      "Drizzle-GraphQL Error: Schema not found in drizzle instance. Make sure you're using drizzle-orm v0.30.9 or above and schema is passed to drizzle constructor!"
    );
  }
  if (typeof config?.relationsDepthLimit === "number") {
    if (config.relationsDepthLimit < 0) {
      throw new Error(
        "Drizzle-GraphQL Error: config.relationsDepthLimit is supposed to be nonnegative integer or undefined!"
      );
    }
    if (config.relationsDepthLimit !== ~~config.relationsDepthLimit) {
      throw new Error(
        "Drizzle-GraphQL Error: config.relationsDepthLimit is supposed to be nonnegative integer or undefined!"
      );
    }
  }
  let generatorOutput;
  if (is6(db, MySqlDatabase2)) {
    generatorOutput = generateSchemaData(db, schema, config?.relationsDepthLimit);
  } else if (is6(db, PgDatabase2)) {
    generatorOutput = generateSchemaData2(db, schema, config?.relationsDepthLimit);
  } else if (is6(db, BaseSQLiteDatabase2)) {
    generatorOutput = generateSchemaData3(db, schema, config?.relationsDepthLimit);
  } else
    throw new Error("Drizzle-GraphQL Error: Unknown database instance type");
  const { queries, mutations, inputs, types } = generatorOutput;
  const graphQLSchemaConfig = {
    types: [...Object.values(inputs), ...Object.values(types)],
    query: new GraphQLObjectType6({
      name: "Query",
      fields: queries
    })
  };
  if (config?.mutations !== false) {
    const mutation = new GraphQLObjectType6({
      name: "Mutation",
      fields: mutations
    });
    graphQLSchemaConfig.mutation = mutation;
  }
  const outputSchema = new GraphQLSchema(graphQLSchemaConfig);
  return { schema: outputSchema, entities: generatorOutput };
};
export {
  buildSchema
};
//# sourceMappingURL=index.js.map