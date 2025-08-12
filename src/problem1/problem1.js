var sum_to_n_a = function (n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum = sum + i;
  }
  return sum;
};

var sum_to_n_b = function (n) {
  let sum = 0;
  let i = 1;
  while (i <= n) {
    sum = sum + i;
    i++;
  }
  return sum;
};

var sum_to_n_c = function (n) {
  return Array.from({ length: n }, (_, i) => i + 1).reduce((total, num) => total + num, 0);
};
