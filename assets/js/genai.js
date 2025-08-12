document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const companySelect = document.getElementById('companySelect');
  const metricSelect = document.getElementById('metricSelect');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error-message');
  const chartCanvas = document.getElementById('trendsChart');
  
  // Chart instance
  let trendsChart = null;
  
  // Data storage
  let rawData = [];
  let companies = new Set();
  
  // Current selections
  let selectedCompany = 'all';
  let selectedMetric = 'GenAI_Exposure';
  
  // Set up event listeners
  companySelect.addEventListener('change', function() {
    selectedCompany = this.value;
    updateChart();
  });
  
  metricSelect.addEventListener('change', function() {
    selectedMetric = this.value;
    updateChart();
  });
  
  // Initialize the page
  loadData();
  
  async function loadData() {
    try {
      const response = await fetch('/exposure/genai_trends.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          if (results.errors.length > 0) {
            showError('Error parsing CSV: ' + results.errors[0].message);
            return;
          }
          
          rawData = results.data;
          
          // Extract unique companies
          rawData.forEach(row => {
            if (row.firm) {
              companies.add(row.firm);
            }
          });
          
          // Populate company dropdown
          populateCompanySelect();
          
          // Hide loading indicator
          loadingElement.style.display = 'none';
          
          // Initialize chart
          updateChart();
        },
        error: function(error) {
          showError('Error parsing CSV: ' + error.message);
        }
      });
    } catch (error) {
      showError('Error loading data: ' + error.message);
    }
  }
  
  function populateCompanySelect() {
    companies.forEach(company => {
      const option = document.createElement('option');
      option.value = company;
      option.textContent = company;
      companySelect.appendChild(option);
    });
  }
  
  function showError(message) {
    loadingElement.style.display = 'none';
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    console.error(message);
  }
  
  function updateChart() {
    const filteredData = filterData();
    const chartData = prepareChartData(filteredData);
    
    renderChart(chartData);
  }
  
  function filterData() {
    if (selectedCompany === 'all') {
      return rawData;
    } else {
      return rawData.filter(row => row.firm === selectedCompany);
    }
  }
  
  function prepareChartData(data) {
    // Group by quarter
    const quarterMap = new Map();
    
    data.forEach(row => {
      if (!row.quarter || row[selectedMetric] === undefined) return;
      
      if (!quarterMap.has(row.quarter)) {
        quarterMap.set(row.quarter, {
          sum: row[selectedMetric],
          count: 1
        });
      } else {
        const current = quarterMap.get(row.quarter);
        current.sum += row[selectedMetric];
        current.count += 1;
      }
    });
    
    // Convert to arrays for Chart.js
    const quarters = Array.from(quarterMap.keys()).sort();
    const values = quarters.map(q => {
      const stats = quarterMap.get(q);
      return stats.sum / stats.count;
    });
    
    return {
      labels: quarters,
      values: values
    };
  }
  
  function renderChart(data) {
    // Destroy existing chart if it exists
    if (trendsChart) {
      trendsChart.destroy();
    }
    
    // Format metric name for display
    const metricDisplayName = selectedMetric.replace('GenAI_', '');
    
    // Create new chart
    trendsChart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: metricDisplayName,
          data: data.values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        title: {
          display: true,
          text: `${metricDisplayName} Trend Over Time`,
          fontSize: 16
        },
        legend: {
          position: 'top'
        },
        scales: {
          xAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Quarter'
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              beginAtZero: true
            },
            scaleLabel: {
              display: true,
              labelString: metricDisplayName
            }
          }]
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        hover: {
          mode: 'nearest',
          intersect: true
        }
      }
    });
  }
});
