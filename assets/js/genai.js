document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error-message');
  const chartContainer = document.getElementById('chart-container');
  const metricSelect = document.getElementById('metric-select');
  const filterSelect = document.getElementById('filter-select');
  
  // Chart variables
  let myChart = null;
  let allData = [];
  let currentMetric = 'GenAI_Exposure';
  let currentFilter = 'all';
  
  // Set up event listeners
  metricSelect.addEventListener('change', function() {
    currentMetric = this.value;
    updateVisualization();
  });
  
  filterSelect.addEventListener('change', function() {
    currentFilter = this.value;
    updateVisualization();
  });
  
  // Load the CSV data
  loadData();
  
  async function loadData() {
    try {
      // Use the correct path to the CSV file
      const response = await fetch('/exposure/genai_trends.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Configure PapaParse with explicit delimiter and header settings
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        delimiter: ",", // Explicitly set delimiter to comma
        skipEmptyLines: true, // Skip empty lines
        complete: function(results) {
          if (results.errors.length > 0) {
            displayError('Error parsing CSV: ' + results.errors[0].message);
            return;
          }
          
          allData = results.data;
          loadingElement.style.display = 'none';
          
          // Check if data was parsed correctly
          if (allData.length === 0 || !allData[0].hasOwnProperty(currentMetric)) {
            displayError('CSV format error: Required columns missing. Please check file format.');
            console.error('Data format issue:', allData.slice(0, 2));
            return;
          }
          
          updateVisualization();
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
    console.error(message);
    loadingElement.style.display = 'none';
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  function updateVisualization() {
    if (!allData || allData.length === 0) return;
    
    // Filter and process data based on current selections
    let processedData;
    
    if (currentFilter === 'all') {
      // Group by quarter, average the metric across all companies
      processedData = processDataByQuarter(allData, currentMetric);
    } else if (currentFilter === 'sector') {
      // Group by sector, average the metric within each sector
      processedData = processDataByCategory(allData, 'sector', currentMetric);
    } else if (currentFilter === 'industry') {
      // Group by industry, average the metric within each industry
      processedData = processDataByCategory(allData, 'industry', currentMetric);
    }
    
    renderChart(processedData);
  }
  
  function processDataByQuarter(data, metricName) {
    // Group by quarter and calculate average metric value
    const quarterMap = new Map();
    
    data.forEach(row => {
      if (!quarterMap.has(row.quarter)) {
        quarterMap.set(row.quarter, { 
          sum: row[metricName] || 0, 
          count: 1 
        });
      } else {
        const current = quarterMap.get(row.quarter);
        current.sum += row[metricName] || 0;
        current.count += 1;
      }
    });
    
    // Convert to array and calculate averages
    const quarters = Array.from(quarterMap.keys()).sort();
    const values = quarters.map(q => {
      const stats = quarterMap.get(q);
      return stats.sum / stats.count;
    });
    
    return {
      labels: quarters,
      datasets: [{
        label: formatMetricName(metricName),
        data: values
      }]
    };
  }
  
  function processDataByCategory(data, categoryField, metricName) {
    // Group by category (sector or industry) and calculate average metric by quarter
    const categoryData = new Map();
    const allQuarters = new Set();
    
    // First pass - collect all quarters and initialize category data
    data.forEach(row => {
      const category = row[categoryField];
      const quarter = row.quarter;
      
      if (!category) return; // Skip rows with missing category
      
      allQuarters.add(quarter);
      
      if (!categoryData.has(category)) {
        categoryData.set(category, new Map());
      }
      
      const categoryMap = categoryData.get(category);
      if (!categoryMap.has(quarter)) {
        categoryMap.set(quarter, { sum: row[metricName] || 0, count: 1 });
      } else {
        const current = categoryMap.get(quarter);
        current.sum += row[metricName] || 0;
        current.count += 1;
      }
    });
    
    // Convert to chart.js format
    const sortedQuarters = Array.from(allQuarters).sort();
    
    // Get top 5 categories by average value
    const categories = Array.from(categoryData.keys());
    const topCategories = categories
      .map(category => {
        const totalSum = Array.from(categoryData.get(category).values())
          .reduce((sum, stats) => sum + stats.sum, 0);
        const totalCount = Array.from(categoryData.get(category).values())
          .reduce((count, stats) => count + stats.count, 0);
        return { 
          name: category, 
          avgValue: totalSum / totalCount 
        };
      })
      .sort((a, b) => b.avgValue - a.avgValue)
      .slice(0, 5)
      .map(item => item.name);
    
    // Create datasets for each top category
    const datasets = topCategories.map((category, index) => {
      const categoryMap = categoryData.get(category);
      const data = sortedQuarters.map(quarter => {
        if (!categoryMap.has(quarter)) return null;
        const stats = categoryMap.get(quarter);
        return stats.sum / stats.count;
      });
      
      return {
        label: category,
        data: data,
        borderColor: getColorForIndex(index),
        backgroundColor: getColorForIndex(index, 0.2),
        fill: false
      };
    });
    
    return {
      labels: sortedQuarters,
      datasets: datasets
    };
  }
  
  function renderChart(chartData) {
    // Destroy existing chart if it exists
    if (myChart) {
      myChart.destroy();
    }
    
    // Clear container
    chartContainer.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    // Create chart
    myChart = new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${formatMetricName(currentMetric)} Over Time`
          },
          legend: {
            position: 'top',
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Quarter'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: formatMetricName(currentMetric)
            }
          }
        }
      }
    });
  }
  
  // Helper function to format metric names for display
  function formatMetricName(metricName) {
    return metricName.replace('GenAI_', '').replace(/_/g, ' ');
  }
  
  // Helper function to get colors for chart lines
  function getColorForIndex(index, alpha = 1) {
    const colors = [
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`
    ];
    return colors[index % colors.length];
  }
});
