const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

// A helper to make selective update queries by making the SET clause for a SQL UPDATE statement

// @param dataToUpdate
  // {Object} {field1: updatedVal, field2: updatedVal, ...}

// @param jsToSql 
  //{Object} maps js-style data fields to database column names,like { firstName: "first_name", age: "age" }
// 
//  @returns {Object} {sqlSetCols, dataToUpdate}

//Need Help with understanding exactly what is happening here - looked at answer

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
