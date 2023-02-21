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
    "Sit to Stand",
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
})();
