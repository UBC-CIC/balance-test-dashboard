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
  // console.log("fn response ctx", ctx);
  const {
    arguments: { patient_id, test_type, from_time, to_time, sort, count },
  } = ctx;
  let testTypeSql = !test_type ? "" : `t.test_type='${test_type}'` + " and";
  let fromTimeSql = !from_time ? "" : `t.start_time>='${from_time}'` + " and";
  let toTimeSql = !to_time ? "" : `t.start_time<='${to_time}'` + " and";
  // let ifCompletedSql = !if_completed
  //   ? ""
  //   : `t.if_completed=${if_completed}` + " and";
  let sortSql = !sort ? "" : `order by t.start_time ${sort}`;
  let countSql = !count ? "" : `limit ${count}`;
  return {
    payload: {
      sql: `select * 
            from "TestEvent" t
            where ${testTypeSql} ${fromTimeSql} ${toTimeSql}
              t.patient_id='${patient_id}'
            ${sortSql} ${countSql}`,
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
  // console.log("response ctx", ctx);
  let res = ctx.prev.result.body;
  return res;
}
