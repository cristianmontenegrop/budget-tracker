let transactions = [];
let myChart;

function populateTotal() {
  // reduce transaction amounts to a single total value
  const total = transactions.reduce((totall, t) => totall + parseInt(t.value, 10), 0);

  const totalEl = document.querySelector('#total');
  totalEl.textContent = total;
}

function populateTable() {
  const tbody = document.querySelector('#tbody');
  tbody.innerHTML = '';

  transactions.forEach((transaction) => {
    // create and populate a table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  const reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  const labels = reversed.map((t) => {
    const date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  const data = reversed.map((t) => {
    sum += parseInt(t.value, 10);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  const ctx = document.getElementById('myChart').getContext('2d');

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Over Time',
        fill: true,
        backgroundColor: '#6666ff',
        data,
      }],
    },
  });
}

function sendTransaction(isAdding) {
  const nameEl = document.querySelector('#t-name');
  const amountEl = document.querySelector('#t-amount');
  const errorEl = document.querySelector('.form .error');

  // validate form
  if (nameEl.value === '' || amountEl.value === '') {
    errorEl.textContent = 'Missing Information';
  } else {
    errorEl.textContent = '';
  }

  // create record
  const transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString(),
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch('/api/transaction', {
    method: 'POST',
    body: JSON.stringify(transaction),
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.errors) {
        errorEl.textContent = 'Missing Information';
      } else {
        // clear form
        nameEl.value = '';
        amountEl.value = '';
      }
    })
    .catch((err) => {
      // fetch failed, so save in indexed db
      console.log(err, 'Attempting to run saveRecord', transaction);
      saveRecord(transaction);

      // clear form
      nameEl.value = '';
      amountEl.value = '';
    });
}
async function initiateApp() {
  // Check for indexed records, if so, add to the transactions
  await getAllRecords().then(async (res) => {
    let indexedTransactions = res;
    console.log('indexedTransactions', indexedTransactions);

    // If the Service Worker didn't generate the POST and clear indexedDB after going back online
    if (window.navigator.onLine && !(indexedTransactions.length === 0)) {
      await fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(indexedTransactions),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        console.log('response from POST BULK: ', response);
        deleteAllRecords();
        indexedTransactions = [];
        return response.json();
      }).catch((err) => console.log(err));
    }
    transactions = indexedTransactions.concat(transactions);
  });

  fetch('/api/transaction')
    .then((response) => response.json())
    .then((data) => {
    // save db data on global variable
      transactions = transactions.concat(data);
      populateTotal();
      populateTable();
      populateChart();
    }).catch((err) => {
      console.log('err', err);
    });
}

initiateApp();

document.querySelector('#add-btn').onclick = () => sendTransaction(true);

document.querySelector('#sub-btn').onclick = () => sendTransaction(false);
