(function main() {
  let curDate = new Date();
  curDate.setDate(curDate.getDate() - 100);
  let arr = [];
  // for (let i=1; i<100; i++){
  //     curDate.setDate(curDate.getDate()+1);
  //     // console.log(curDate)
  //     arr.push({name: curDate.toLocaleString(), score: Math.floor(Math.random() * 101)})
  // }
  let test = [
    "sit-to-stand",
    "One-foot Stand",
    "Sitting with Back Unsupported",
  ];
  for (let i = 1; i < 50; i++) {
    if (i % 3 == 0) {
      curDate.setDate(curDate.getDate() + 1);
    }

    arr.push({
      id: i,
      score: Math.floor(Math.random() * 101),
      movement: test[i % 3],
      date: curDate.toLocaleString(),
      notes: "",
    });
  }
  console.log(arr);
  console.log("Hello World!");

  var now = new Date();
  console.log(now);
  const array = [];
  for (let i = 0; i < 100; i++) {
    now.setSeconds(now.getSeconds() + 1); // timestamp
    now = new Date(now); // Date object
    arr.push({
      id: i,
      measurement: (Math.random() * (5.0 + 5.0) - 5.0).toFixed(4),
      timestamp: now.toLocaleString(),
    });
  }
  console.log(array);
})();
