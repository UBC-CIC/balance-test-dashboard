import pg from "pg";
// const dotenv = require("dotenv");
// dotenv.config();
let pool;
const connectDb = async () => {
  try {
    pool = new pg.Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    });
    await pool.connect();
    console.log("pool connected");
    // await pool.end();
  } catch (error) {
    console.log("err");
    console.log(error);
  }
};

export const handler = async (event) => {
  let response;
  try {
    console.log("event", event);
    let sql = event.payload.sql;
    // let sql=`select * from "Patient" where patient_id='1'`;
    await connectDb();
    console.log(`about to execute sql: `, sql);
    let res = await pool.query(sql);
    console.log("sql execution result", res);

    response = {
      statusCode: 200,
      body: res.rows,
    };
  } catch (e) {
    response = { statusCode: 200, body: err };
  }
  return response;
};
