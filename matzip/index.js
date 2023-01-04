async function getDateSet(category) {
  let qs = category;
  if (!qs) {
    qs = "";
  }
  const dataSet = await axios({
    method: "get",
    url: `http://localhost:3000/restaurants?category=${qs}`,
    headers: {},
    data: {},
  });
  console.log(dataSet);
}
