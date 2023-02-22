import pg from "pg";
// const dotenv = require("dotenv");
// dotenv.config();
const connectDb = async () => {
  try {
    const pool = new pg.Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    });
    console.log("13");
    await pool.connect();
    console.log("15");
    const res = await pool.query(``);
    console.log(res);
    // await pool.end();
    console.log("18");
  } catch (error) {
    console.log("err");
    console.log(error);
  }
};

export const handler = async (event) => {
  await connectDb();

  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
  return response;
};
