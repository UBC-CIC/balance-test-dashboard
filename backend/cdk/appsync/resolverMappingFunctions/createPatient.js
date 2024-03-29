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
    arguments: { patient_id, first_name, last_name, email },
  } = ctx;
  let sql = !email
    ? `insert into "Patient" (patient_id, first_name, last_name, email) values ('${patient_id}', '${first_name}','${last_name}', null)`
    : `insert into "Patient" (patient_id, first_name, last_name, email) values ('${patient_id}', '${first_name}', '${last_name}','${email}')`;
  sql += ` returning *;`;
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
  // console.log("response ctx", ctx);
  let res = ctx.prev.result.body;
  return res[0];
}
