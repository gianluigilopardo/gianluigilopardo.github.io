document.addEventListener('DOMContentLoaded', function() {
  // Set up loading state
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error-message');
  const chartContainer = document.getElementById('chart-container');
  let myChart = null;
  
  // Chart configuration variables
  let chartType = 'line';
  let dataPeriod = 'all';
  
  // Set up event listeners for controls
  const chartTypeSelect = document.getElementById('chart-type');
  const dataPeriodSelect = document.getElementById('data-period');
  
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', function() {
      chartType = this.value;
      updateChart(chartData);
    });
  }
  
  if (dataPeriodSelect) {
    dataPeriodSelect.addEventListener('change', function() {
      dataPeriod = this.value;
      updateChart(chartData);
    });
  }
  
  // Main data variable
  let chartData = [];
  
  // Load CSV data
  loadCSVData();
  
  async function loadCSVData() {
    try {
      // Use root-relative path for the CSV file
      const response = await fetch('/exposure/genai_trends.csv');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Parse CSV using PapaParse
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
          loadingElement.style.display = 'none';
          
          if (results.errors.length > 0) {
            displayError('Error parsing CSV: ' + results.errors[0].message);
            return;
          }
          
          chartData = results.data;
          updateChart(chartData);
        },
        error: function(error) {
          displayError('Error parsing CSV: ' + error.message);
        }
      });
      
    } catch (error) {
      displayError('Error loading data: ' + error.message);
    }
  }
  
  function displayError(message) {
    loadingElement.style.display = 'none';
    errorElement.textContent = message;
    console.error(message);
  }
  
  function updateChart(data) {
    // Filter data based on selected period
    let filteredData = filterDataByPeriod(data, dataPeriod);
    
    // Process data for chart
    const labels = filteredData.map(row => row.date);
    const values = filteredData.map(row => row.value);
    
    // Destroy previous chart instance if it exists
    if (myChart) {
      myChart.destroy();
    }
    
    // Create chart context
    const ctx = document.createElement('canvas');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(ctx);
    
    // Create new chart
    myChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: 'GenAI Trend',
          data: values,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  function filterDataByPeriod(data, period) {
    if (period === 'all' || !data.length) {
      return data;
    }
    
    const now = new Date();
    let cutoffDate;
    
    if (period === 'year') {
      cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else if (period === 'month') {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    return data.filter(row => {
      const rowDate = new Date(row.date);
      return rowDate >= cutoffDate;
    });
  }
});
