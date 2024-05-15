// various methods assisted with chat GPT
var user;
var session;
var key1 = "placeholder for an API key"
var key2 = "placeholder for an API key"
var URL = 'https://api.polygon.io/v3/reference/'
var stockList = [];
var indexOfStock;
var favStock = [];
let myChart = null;

function login() {
  var username = $("#loginUsername").val();
  var password = $("#loginPassword").val();

  $.ajax({
    url: "final.php/login", // URL to the PHP function
    method: "GET", // HTTP method (GET or POST)
    data: {
      username: username,
      password: password
    },
  }).done(function (data) { // Callback function if the request succeeds

    console.log("Status:", data.status);
    console.log("Message:", data.message);

    // Handle the response accordingly (e.g., show a message to the user)
    if (data.status === 0) {
      $("#historyNavButton").css('visibility', 'visible');
      alert("Login successful");
      user = username;
      session = data.session;
      localStorage.setItem('user', user);
      localStorage.setItem('session', session);
      // Show logout button
      $("#loginNavButton").css('visibility', 'hidden');
      $("#signUpNavButton").css('visibility', 'hidden');
      $("#logoutButton").css('visibility', 'visible');
      $("#loginModal").modal('hide');

    } else {
      alert("Login failed: " + data.message);
    }
  }).fail(function (error) { // Callback function if the request fails
    console.log("Error:", error.statusText);
    // Handle the error (e.g., show an error message to the user)
    alert("Error occurred while processing your request");
  });
}

function signUp() {
  var name = $('#signUpName').val();
  var username = $("#signUpUsername").val();
  var password = $("#signUpPassword").val();
  var confirm = $('#signUpPasswordConfirm').val();

  alert(name);
  alert(username);
  alert(password);
  alert(confirm);
  if (confirm != password) {
    return alert("Passwords do not match, try again!")
  }
  $.ajax({
    url: "final.php/signUp", // URL to the PHP function
    method: "GET", // HTTP method (GET or POST)
    data: {
      name: name,
      username: username,
      password: password,
    }, // Data to be sent to the server
  }).done(function (data) { // Callback function if the request succeeds

    console.log("Status:", data.status);
    console.log("Message:", data.message);

    // Handle the response accordingly (e.g., show a message to the user)
    if (data.status === 0) {
      alert("SignUp successful");
      // Hide modal
      $("#signUpModal").modal('hide');
    } else {
      alert("Signup failed: " + data.message);
    }
  }).fail(function (error) { // Callback function if the request fails
    console.log("Error:", error.statusText);
    // Handle the error (e.g., show an error message to the user)
    alert("Error occurred while processing your request");
  });
}

function logout() {

  $.ajax({
    url: "final.php/logout", // URL to the PHP function
    method: "GET", // HTTP method (GET or POST)
    data: {
      username: user,
      session: session
    }, // Data to be sent to the server
  }).done(function (data) { // Callback function if the request succeeds
    // Handle the response accordingly (e.g., show a message to the user)
    if (data.status === 0) {
      $('#favoriteStockContainer').empty();
      alert("Logout successful");
      $("#historyNavButton").css('visibility', 'hidden');
      $("#loginNavButton").css('visibility', 'visible');
      $("#signUpNavButton").css('visibility', 'visible');
      $("#logoutButton").css('visibility', 'hidden');
      user = "";
      session = "";
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      // Optionally, redirect the user to another page
      // window.location.href = "dashboard.html";
    } else {
      alert("Logout failed: " + data.message);
      $("#loginNavButton").css('visibility', 'visible');
      $("#signUpNavButton").css('visibility', 'visible');
      $("#logoutButton").css('visibility', 'hidden');
    }
  }).fail(function (error) { // Callback function if the request fails
    console.log("Error:", error.statusText);

    // Handle the error (e.g., show an error message to the user)
    alert("Error occurred while processing your request");
  });
}

function populateDropdown(selectedValue) {
  $.ajax({
    url: URL + "tickers",
    method: 'GET',
    data: {
      exchange: selectedValue,
      market: 'stocks',
      apiKey: 'snPd7e0S2_ZiOD5ozmZwphRL1hRg_1_W',
      active: true
    }
  }).done(function (data) {
    indexOfStock = 0;
    stockList = data.results;
    for (let i of data.results) {
      $("#stock-dropdown").append("<li><a class = 'dropdown-item dropdown-stock' data-value='" + indexOfStock + "'>" + stockList[indexOfStock].name.substring(0, 30) + "(" + stockList[indexOfStock].ticker + ")</a></li>");
      indexOfStock++;
    }

  }).fail(function (error) {
    // Handle the error (e.g., show an error message to the user)
    alert("Error occurred while processing your request");
  });
}

function populateCard(selectedStock) {
  $('#selectedStockName').html(selectedStock.name + " (" + selectedStock.ticker + ")");
  var today = new Date();
  var oneDayAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  var tenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);

  var start = formatDate(tenDaysAgo);
  var end = formatDate(oneDayAgo);

  console.log("start date:" + start);
  console.log("end date: " + end);
  $.ajax({
    url: 'https://api.polygon.io/v2/aggs/ticker/' + selectedStock.ticker + '/range/1/day/' + start + '/' + end,
    method: 'GET',
    data: {
      apiKey: key2,
      active: true,
      sort: 'asc'
    }
  }).done(function (data) {
    console.log(data);
    console.log(data.resultsCount);
    if (data.resultsCount >= 5) {
      var lastFiveDays = data.results.slice(-5);

      let labels = lastFiveDays.map(result => new Date(result.t).toLocaleDateString());
      let closingPrices = lastFiveDays.map(result => result.c);

      // Create visual graph of stock closing price over past 5 days
      createGraph(lastFiveDays);

      // Retrieve news articles for the stock
      getTickerNews(selectedStock.ticker);

      $('#selectedStockLow').html("Low: " + data.results[data.resultsCount - 1].l);
      $('#selectedStockHigh').html("High: " + data.results[data.resultsCount - 1].h);
      $('#selectedStockClose').html("Close: " + data.results[data.resultsCount - 1].c);
      $('#selectedStockOpen').html("Open: " + data.results[data.resultsCount - 1].o);
      $('#selectedStockVolume').html("Volume: " + data.results[data.resultsCount - 1].v);
      $('#addFavoritesButton').removeAttr('disabled');

      let dif = ((data.results[data.resultsCount - 1].c - data.results[data.resultsCount - 2].c) / data.results[data.resultsCount - 2].c);
      dif = Number(dif.toFixed(2));
      $('#selectedStockChange').html("Daily Change: " + dif + "%")
        .removeClass('text-success text-danger')
        .addClass(dif < 0 ? 'text-danger' : 'text-success');


      favStock[0] = selectedStock.ticker;
      favStock[1] = selectedStock.name;
      favStock[2] = data.results[data.resultsCount - 1].o;
      favStock[3] = data.results[data.resultsCount - 1].h;
      favStock[4] = data.results[data.resultsCount - 1].l;
      favStock[5] = data.results[data.resultsCount - 1].c;
      favStock[6] = dif;
      favStock[7] = (dif >= 0);
      favStock[8] = data.results[data.resultsCount - 1].v;
      console.log(favStock);
    }
  }).fail(function (error) {
    // Handle the error (e.g., show an error message to the user)
    alert("Error occurred while processing your request");
  });
}



$('.dropdown-menu a').click(function () {
  var selectedValue = $(this).data('value'); // This gets the data-value attribute of the clicked item
  console.log('Selected value:', selectedValue); // Output the value to the console
  populateDropdown(selectedValue);  // Populates the stock ticker dropdown

  // Update the button text to the selected item's text
  $('#exchangeDropdownButton').text($(this).text());
});

$(document).on('click', '.dropdown-stock', function () {
  var index = $(this).data('value'); // Retrieve the index stored in data-value
  var selectedStock = stockList[index]; // Access the stock using the index
  populateCard(selectedStock);
  console.log('Selected stock:', selectedStock.ticker); // Output the selected stock ticker to the console

  // Update the button text to the selected item's text
  $('#selectStockButton').text(selectedStock.name.substring(0, 25) + " (" + selectedStock.ticker + ")");
});

$(document).ready(function () {
  var storedUser = localStorage.getItem('user');
  var storedSession = localStorage.getItem('session');
  if (storedUser && storedSession) {
    user = localStorage.getItem('user'); ``
    session = localStorage.getItem('session');
    $("#loginNavButton").css('visibility', 'hidden');
    $("#signUpNavButton").css('visibility', 'hidden');
    $("#logoutButton").css('visibility', 'visible');
    $('#historyNavButton').css('visibility', 'visible');
    populateFavorites();
    populateHistory();
  } else {
    // User is not logged in, show login button
    $("#loginNavButton").css('visibility', 'visible');
    $("#signUpNavButton").css('visibility', 'visible');
    $("#logoutButton").css('visibility', 'hidden');
  }
});

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addStockToFavorites() {
  let date1 = new Date();
  if (user == null || user == "") {
    alert("Please log in before adding favorites!");
  } else {
    if (favStock.length == 9) {
      $.ajax({
        url: "final.php/addFavorite",
        method: "GET",
        data: {
          ticker: favStock[0],
          name: favStock[1],
          open: favStock[2],
          high: favStock[3],
          low: favStock[4],
          close: favStock[5],
          diff: favStock[6],
          up: favStock[7],
          volume: favStock[8],
          user: user,
          date: date1
        }
      }).done(function (data) {
        populateFavorites();
        console.log('added stock successfully');
        if (data.message == "SQLSTATE[23000]: Integrity constraint violation: 19 UNIQUE constraint failed: favorite.ticker") {
          alert("Cannot add stock as a favorite twice!")
        }
        // Data to be sent to the server
      }).fail(function (error) {
        console.log('failed to add stock');
        console.log(error.message);
      });
    }
  }
}

function removeStockFromFavorites(tick, name) {
  let date1 = new Date();
  if (user == null || user == "") {
    alert("Please log in before removing favorites!");
  } else {
    $.ajax({
      url: "final.php/removeFavorite",
      method: "GET",
      data: {
        ticker: tick,
        name: name,
        user: user,
        date: date1
      }
    }).done(function (data) {
      console.log('removed stock successfully');
      populateFavorites();
      // Data to be sent to the server
    }).fail(function (error) {
      console.log('failed to add stock');
      console.log(error.message);
    });
  }
}


function createGraph(lastFiveDays) {
  const ctx = document.getElementById('stockChart').getContext('2d');

  // Check if the chart instance exists
  if (myChart) {
    myChart.destroy();  // Destroy the existing chart
  }

  const lineColor = lastFiveDays[4].c < lastFiveDays[0].c ? 'rgb(255, 99, 132)' : 'rgb(40, 167, 69)'; // Red if the price went down, green otherwise

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['-5', '-4', '-3', '-2', '-1'], // X-axis labels
      datasets: [{
        label: 'Closing Price Over Past 5 Trading Days',
        data: [lastFiveDays[0].c, lastFiveDays[1].c, lastFiveDays[2].c, lastFiveDays[3].c, lastFiveDays[4].c],
        fill: false,
        borderColor: lineColor,
        tension: 0.1
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Trading day',  // X-axis label
            font: {
              size: 16
            }
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Closing Price ($)',  // Y-axis label
            font: {
              size: 16
            }
          }
        }
      }
    }
  });
}


function getTickerNews(ticker) {
  console.log("getTickerNews() ran");
  console.log("Passed ticker: " + ticker);
  $.ajax({
    url: 'https://api.polygon.io/v2/reference/news',
    method: 'GET',
    data: {
      ticker: ticker,
      apiKey: key2,
      limit: 5
    }
  }).done(function (data) {
    let articles = data.results;
    let numOfArticles = articles.length;
    console.log("Number of News Articles: " + numOfArticles);
    $('#newsContainer').empty();  // Clear old news if any
    articles.forEach(article => {
      $('#newsContainer').append(`
        <div class="row g-0 bg-light position-relative">
          <div class="col-md-6 mb-md-0 p-md-4">
            <img src="${article.image_url || 'placeholder-image.jpg'}" class="w-100" alt="${article.title}">
          </div>
          <div class="col-md-6 p-4 ps-md-0">
            <h5 class="mt-0">${article.title}</h5>
            <p>${article.description}</p>
            <a href="${article.article_url}" class="stretched-link">Read more</a>
          </div>
        </div>
      `);
    });
    if (numOfArticles == 0) {
      $('#newsContainer').append(`
        <div class="row centered-row">
          <div class="col-md-12 text-center">
            <h2 class="text-danger mt-3">No Relevant News Found for ${ticker}</h2>
          </div>
        </div>
      `);
    }
  }).fail(function (error) {
    alert("Error occurred while retrieving relevant news articles");
  });
}

function populateFavorites() {
  if (user == null || user == "") {
    console.log('No user logged in');
  } else {
    $.ajax({
      url: "final.php/grabFavorites",
      method: "GET",
      data: { user: user }
    }).done(function (data) {
      $('#favoriteStockContainer').empty(); // Clear previous entries
      let favStockNum = 0;
      data.forEach(function (stock) {
        let changeClass = stock.up === "true" ? 'text-success' : 'text-danger'; // Determine class based on stock.up
        favStockNum++;
        $('#favoriteStockContainer').append(`
          <div class="col-md-12 mt-3">
            <div class="card mx-3 mb-3">
              <div class="card-header">
                Favorite Stock ${favStockNum}
              </div>
              <div class="card-body">
                <h5 class="card-title mb-3">${stock.nm} (${stock.ticker})</h5>
                <div class="row centered-row">
                  <div class="col-md-6">
                    <h5 class="card-text text-info">Low: ${stock.l}</h5>
                  </div>
                  <div class="col-md-6">
                    <h5 class="card-text text-warning">High: ${stock.h}</h5>
                  </div>
                </div>
                <div class="row centered-row my-3">
                  <div class="col-md-6">
                    <h5 class="card-text">Close: ${stock.cl}</h5>
                  </div>
                  <div class="col-md-6">
                    <h5 class="card-text text-secondary">Open: ${stock.o}</h5>
                  </div>
                </div>
                <div class="row centered-row my-3">
                  <div class="col-md-6">
                    <h5 class="card-text ${changeClass}">Daily Change: ${stock.diff}%</h5>
                  </div>
                  <div class="col-md-6">
                    <h5 class="card-text text-primary">Volume: ${stock.volume}</h5>
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary w-100" onclick="removeStockFromFavorites('${stock.ticker}', '${stock.nm}')">Remove Stock from Favorites</button>
              </div>
            </div>
          </div>
        `);
      });
    }).fail(function (error) {
      console.log('Failed to display favorites');
      console.log(error.message);
    });
  }
}

function populateHistory(ascending) {
  var startDateH = $('#startDateHistory').val() ? new Date(formatDateH($('#startDateHistory').val())) : new Date(new Date().setFullYear(new Date().getFullYear() - 100));
  startDateH.setDate(startDateH.getDate() + 1); // Adjust for inclusive date range

  var endDateH = $('#endDateHistory').val() ? new Date(formatDateH($('#endDateHistory').val())) : new Date(new Date().setFullYear(new Date().getFullYear() + 100));
  endDateH.setDate(endDateH.getDate() + 1); // Adjust for inclusive date range

  console.log("Start Date: " + startDateH);
  console.log("End Date: " + endDateH);

  $.ajax({  
    url: "final.php/grabHistory",
    method: "GET",
    data: { user: user }
  }).done(function(data) {
    // Filter data based on date range
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.dateTime);
      return itemDate >= startDateH && itemDate <= endDateH;
    });

    // Group data by formatted date
    const groupedByDate = groupBy(filteredData, item => {
      const date = new Date(item.dateTime);
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    });

    // Sort dates in ascending or descending order
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const dateA = new Date(a), dateB = new Date(b);
      return ascending ? dateA - dateB : dateB - dateA;
    });

    $('#historyContainer').empty(); // Clear the existing entries
    let EODList =[];
    let i = 0;
    sortedDates.forEach(date => {
      const card = $('<div class="card mx-3 mb-3"></div>');
      const cardHeader = $('<div class="card-header"><h5 class="card-text">' + date + '</h5></div>');
      
      card.append(cardHeader);

      // Sort entries within each date by time in ascending or descending order
      const sortedEntries = groupedByDate[date].sort((a, b) => {
        const timeA = new Date(a.dateTime), timeB = new Date(b.dateTime);
        return ascending ? timeA - timeB : timeB - timeA;
      });

      sortedEntries.forEach(entry => {
        let actionColor = entry.action === "Added" ? 'text-success' : 'text-danger';
        const cardBody = $('<div class="card-body"></div>');
        const row = $('<div class="row centered-row"></div>');
        const colNameTicker = $('<div class="col-md-4 text-center"><h5 class="card-text">' + entry.name + ' (' + entry.ticker + ')</h5></div>');
        const colTime = $('<div class="col-md-4 text-center"><h5 class="card-text">' + new Date(entry.dateTime).toLocaleTimeString() + '</h5></div>');
        const colAction = $('<div class="col-md-4 text-center"><h5 class="card-title ' + actionColor + '">' + entry.action + '</h5></div>');
        if (entry.action == 'Added') {
          EODList[i] = entry.ticker;
          i++;
        } else {
          EODList = EODList.filter(ticker => ticker !== entry.ticker); // Remove from EODList
        }
        row.append(colNameTicker, colTime, colAction);
        cardBody.append(row);
        card.append(cardBody);
      });
      if (EODList.length > 0) {
        const eodSection = $('<div class="card-footer"></div>');
        const eodText = EODList.join(' ');
        eodSection.append(`<p>End of Day Added Stocks: ${eodText}</p>`);
        card.append(eodSection);
      }
      $('#historyContainer').append(card);
    });
    console.log(EODList);
  }).fail(function(error) {
    console.error('Failed to populate history', error);
  });
}

// Helper function to group data by key
function groupBy(array, keyGetter) {
  const map = new Map();
  array.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return Object.fromEntries(map);
}

function formatDateH(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;
  return [year, month, day].join('-');
}
