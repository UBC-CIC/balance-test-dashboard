/**
 * These are available AWS AppSync utilities that you can use in your request and response handler.
 * For more information about the utilities that are currently implemented, see
 * https://docs.aws.amazon.com/en_us/appsync/latest/devguide/resolver-reference-overview-js.html#utility-resolvers.
 */
import { util } from "@aws-appsync/utils";

/**
 * This function is invoked before the request handler of the first AppSync function in the pipeline.
 * The resolver request handler allows you to perform some preparation logic
 * before executing the defined functions in your pipeline.
 * @param ctx - Contextual information for your resolver invocation
 */
export function request(ctx) {
  console.log("request ctx", ctx);
  const {
    arguments: {
      test_event_id,
      test_type,
      balance_score,
      doctor_score,
      start_time,
      end_time,
      if_completed,
    },
  } = ctx;
  let balanceScoreSql = !balance_score
    ? ""
    : `balance_score = ${balance_score}` + ",";
  let doctorScoreSql = !doctor_score
    ? ""
    : `doctor_score = ${doctor_score}` + ",";
  let startTimeSql = !start_time ? "" : `start_time = ${start_time}` + ",";
  let endTimeSql = !end_time ? "" : `end_time = ${end_time}` + ",";
  let ifCompletedSql = !if_completed
    ? ""
    : `if_completed = ${if_completed}` + ",";

  // let sqlSetStatements = [];
  let sqlSetStatement =
    balanceScoreSql +
    doctorScoreSql +
    startTimeSql +
    endTimeSql +
    ifCompletedSql;
  sqlSetStatement = sqlSetStatement.substring(0, sqlSetStatement.length - 1);
  // if (balance_score) {
  //   sqlSetStatements.push(`balance_score = ${balance_score}`);
  //   sqlSetStatements.push(`if_completed = false`);
  // }
  // if (doctor_score) sqlSetStatements.push(`doctor_score = ${doctor_score}`);
  // if (start_time) sqlSetStatements.push(`start_time = ${start_time}`);
  // if (end_time) sqlSetStatements.push(`end_time = ${end_time}`);

  // for (let i = 0; i < sqlSetStatements.length; i++) {
  //   if (i == sqlSetStatements.length - 1) {
  //     sqlSetStatement += sqlSetStatements[i];
  //   } else {
  //     sqlSetStatement += sqlSetStatements[i] + ",";
  //   }
  // }

  let sql = `UPDATE "TestEvent" 
            SET ${sqlSetStatement}
            WHERE test_event_id = '${test_event_id}' and test_type = '${test_type}';`;
  return {
    payload: {
      sql: sql,
    },
  };
}

/**
 * Pipeline functions exhibit the following behaviors:
 * 1) Between your request and response handler, the functions of your pipeline resolver will run in sequence.
 * 2) The resolver's request handler result is made available to the first function as ctx.prev.result.
 * 3) Each function's response handler result is available to the next function as ctx.prev.result.
 */

/**
 * This function is invoked after the response handler of the last AppSync function in the pipeline.
 * The resolver response handler allows you to perform some final evaluation logic
 * from the output of the last function to the expected GraphQL field type.
 * @param ctx - Contextual information for your resolver invocation.
 */
export function response(ctx) {
  console.log("response ctx", ctx);
  let res = ctx.prev.result.body;
  return res[0];
}
