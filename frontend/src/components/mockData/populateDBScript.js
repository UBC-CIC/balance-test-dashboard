import dayjs from "dayjs";

const { Amplify, API, graphqlOperation } = require("aws-amplify");
const awsconfig = require("../../aws-exports");
const {
  createAndAssignTest,
  createPatient,
  putTestResult,
} = require("../../graphql/mutations");
Amplify.configure(awsconfig);
const { v4 } = require("uuid");

let tests = [
  "572a985c-5817-45c2-905c-1f8a366e64b7",
  "472dc390-106f-4423-a576-e762eb592ca8",
  "d5df6a32-635c-47b3-b23f-89881fb0251c",
  "93a7a735-f5b1-4721-bc5b-15c1fca42f29",
  "dc7f7d49-6b95-47c6-9e50-6ce38c3ea292",
  "090464ef-f203-4d55-8306-a813947e679e",
  "e487148a-d559-477d-a624-222802b02036",
  "86b62e1d-f1d0-41f5-b4a8-8ef60afcf432",
  "0f22b292-3cba-43b3-b6ea-b03721b0020b",
  "51cdadd2-d896-4aa2-9955-3354ec304c45",
  "848d5178-7fae-4df3-9f45-dd989cbf2114",
  "f3d02938-b765-4205-a64b-2455c8743a4f",
  "8c38b746-be8e-40c2-95d8-54be66f3a5c2",
  "f348b9dd-2777-42de-9734-effddb4e0477",
  "6c641130-ef68-4077-ba00-180139f6a779",
  "16de5f1d-1c3c-41e4-9f68-6617ec9915f2",
  "e2459182-7df0-43df-b649-2026fb46063d",
  "636b29ef-d5ff-4425-94ec-fe142a433520",
  "df6c94ae-a496-490a-8bf9-f9fc75f1800a",
  "6eb65ca9-81e5-406b-b4d9-d7a3e8939cc8",
  "85ec1887-c909-49ea-b80c-98d81827b232",
  "eb3faa89-1ee5-4734-95bc-bfeab51946a2",
  "b8fe60f4-5e94-4cce-9645-a25e44cad167",
  "433243b8-8a8e-482b-bd41-10983cdf50eb",
  "af0d4aa5-39af-4d9e-a3ec-c8f50414816a",
  "d5b94b3b-a651-48fa-9123-033ac4af04c3",
  "79a95e18-3079-43a4-8abc-040d6f8f8d67",
  "5f2cec8d-ca69-4fb3-ab92-ae20c451fedc",
  "91118dd8-d28b-4536-a3f0-f583ddc80713",
  "40d7795e-3c27-411a-837b-4128eed65abf",
  "3296699d-c21b-434b-b25b-f9a2f5897602",
  "f48aacef-5baa-4ca1-874e-cfb0478c1223",
  "6f7723ba-e09a-4c93-884d-79e66bfc96bf",
  "610d1e67-275b-4e5d-9b2a-5891acf8e1fe",
  "b8fc2380-2585-4d41-aa12-59f9102f04ba",
  "a0f43d75-3183-44d6-9cb2-c30aff95929e",
  "a8231565-ff4f-456c-9da5-7eabd0e6a51d",
  "e9e20d1c-b8e6-4986-9a1f-673653ec22bb",
  "40234f95-f07e-4abf-bdba-a5b9a453727e",
  "a66f59d1-2e25-47bf-9741-1ff21d27ef95",
  "6784a9f4-bbd2-4d74-b528-b44a8f59d183",
  "fb52a614-e2d6-4c2a-8211-9937391108ae",
  "7453cb11-152f-4227-b70d-88b601486e1d",
  "6f98d21f-ed21-49eb-b0a8-11b91c8bd5ae",
  "747f6b32-10c6-41cc-8af2-7dcde1f507a2",
];

function handleExecute() {
  // API.graphql(
  //   graphqlOperation(createAndAssignTest, {
  //     test_event_id: v4(),
  //     patient_id: "217016f5-3dbf-41b3-8438-b414c2a95f0d",
  //     test_type: "sit to stand",
  //   })
  // ).then((res) => {
  //   console.log(res);
  //   tests.push(res.data.createAndAssignTest.test_event_id);
  // });

  // console.log(tests);
  // API.graphql(
  //   graphqlOperation(createAndAssignTest, {
  //     test_event_id: v4(),
  //     patient_id: "795e8a28-751d-4c96-9574-4a55d4e97b22",
  //     test_type: "sit to stand",
  //   })
  // ).then((res) => console.log(res));
  // API.graphql(
  //   graphqlOperation(putTestResult, {
  //     test_event_id: v4(),
  //     patient_id: "217016f5-3dbf-41b3-8438-b414c2a95f0d",
  //     test_type: "sit to stand",
  //   })
  // ).then((res) => {
  //   console.log(res);
  //   tests.push(res.data.createAndAssignTest.test_event_id);
  // });

  let startDate = dayjs("2023-02-27 09:43:01").subtract(50, "day");
  console.log(startDate.format("YYYY-MM-DD hh:mm:ss"));
  // const startDate = startDate;

  for (let t = 0; t < tests.length; t++) {
    console.log("startdate", startDate);
    API.graphql(
      graphqlOperation(putTestResult, {
        test_event_id: tests[t],
        balance_score: Math.floor(Math.random() * 101),
        start_time: startDate.add(t, "day").format("YYYY-MM-DD hh:mm:ss"),
        end_time: startDate
          .add(t, "day")
          .add(60, "seconds")
          .format("YYYY-MM-DD hh:mm:ss"),
        if_completed: true,
      })
    ).then((res) => {
      console.log(res);
      // startDate.add(1, "day");
      // tests.push(res.data.createAndAssignTest.test_event_id);
    });
  }
}

export default function Execute() {
  return <button onClick={handleExecute}>execute</button>;
}
