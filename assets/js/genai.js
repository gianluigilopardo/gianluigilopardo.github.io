const LAST_UPDATE = 'January 2025';

document.addEventListener('DOMContentLoaded', () => {
  const lu = document.getElementById('lastUpdate');
  if (lu) lu.textContent = 'Last data update: ' + LAST_UPDATE;

  let data = [];
  let chart = null;

  const colors = {
    'GenAI_Exposure': 'rgb(0, 0, 0)',
    'GenAI_Risk': 'rgb(220, 53, 69)',
    'GenAI_Adoption': 'rgb(40, 167, 69)',
    'GenAI_Opportunity': 'rgb(0, 123, 255)'
  };

  const metricLabels = {
    'GenAI_Exposure': 'Overall Exposure',
    'GenAI_Risk': 'Risk',
    'GenAI_Adoption': 'Adoption',
    'GenAI_Opportunity': 'Opportunity'
  };

  async function loadData() {
    try {
      const response = await fetch('exposure/genai_trends.csv');
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const csvContent = await response.text();
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        complete: results => {
          data = results.data.filter(row => row.quarter && row.ticker);
            data.sort((a,b) => a.quarter === b.quarter
              ? a.ticker.localeCompare(b.ticker)
              : a.quarter.localeCompare(b.quarter));

          initializeFilters();
          updateChart();
          const l = document.getElementById('loading');
          if (l) l.style.display = 'none';
        },
        error: err => {
          const l = document.getElementById('loading');
          if (l) l.textContent = 'Error loading data: ' + err.message;
        }
      });
    } catch (e) {
      const l = document.getElementById('loading');
      if (l) l.textContent = 'Error reading exposure/genai_trends.csv.';
      console.error(e);
    }
  }

  function initializeFilters() {
    const filterType = document.getElementById('filterType');
    const filterValueGroup = document.getElementById('filterValueGroup');
    const filterValue = document.getElementById('filterValue');
    const searchInput = document.getElementById('searchInput');

    filterType.addEventListener('change', function() {
      if (this.value === 'all') {
        filterValueGroup.style.display = 'none';
      } else {
        filterValueGroup.style.display = 'block';
        populateFilterValues(this.value);
      }
      updateSentimentOption();
    });

    filterValue.addEventListener('change', updateSentimentOption);

    searchInput.addEventListener('input', function() {
      filterOptions(this.value.toLowerCase());
    });

    updateSentimentOption();
  }

  function filterOptions(term) {
    const filterValue = document.getElementById('filterValue');
    Array.from(filterValue.options).forEach(o => {
      o.style.display = o.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  }

  function updateSentimentOption() {
    const ft = document.getElementById('filterType').value;
    const fv = document.getElementById('filterValue');
    const sentimentOption = document.getElementById('sentimentOption');
    if (ft === 'all' || fv.selectedOptions.length === 1) {
      sentimentOption.style.display = 'block';
    } else {
      sentimentOption.style.display = 'none';
      if (document.getElementById('selectedMetric').value === 'sentiment') {
        document.getElementById('selectedMetric').value = 'GenAI_Exposure';
      }
    }
  }

  function populateFilterValues(type) {
    const filterValue = document.getElementById('filterValue');
    const searchInput = document.getElementById('searchInput');
    filterValue.innerHTML = '';
    searchInput.value = '';

    let values = [];
    if (type === 'sector') values = [...new Set(data.map(d => d.sector))];
    else if (type === 'industry') values = [...new Set(data.map(d => d.industry))];
    else if (type === 'firm') values = [...new Set(data.map(d => d.firm))];

    values = values.filter(v => v).sort();
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = v;
      filterValue.appendChild(opt);
    });

    if (values.length > 0) {
      filterValue.options[0].selected = true;
      if (values.length > 1) filterValue.options[1].selected = true;
    }
    updateSentimentOption();
  }

  function getFilteredData() {
    const ft = document.getElementById('filterType').value;
    const fv = document.getElementById('filterValue');
    let filtered = data;
    if (ft !== 'all') {
      const selected = Array.from(fv.selectedOptions).map(o => o.value);
      if (selected.length) {
        filtered = data.filter(row => selected.includes(row[ft]));
      }
    }
    return filtered;
  }

  function aggregateDataByEntity(filteredData, metric, filterType) {
    const quarters = [...new Set(filteredData.map(d => d.quarter))].sort();
    const entities = [...new Set(filteredData.map(d => d[filterType]))].filter(e => e).sort();
    const aggregated = {};
    entities.forEach(entity => {
      aggregated[entity] = {};
      quarters.forEach(q => {
        const qd = filteredData.filter(d => d.quarter === q && d[filterType] === entity);
        const vals = qd.map(d => d[metric]).filter(v => v !== null && v !== undefined && !isNaN(v));
        if (vals.length) aggregated[entity][q] = vals.reduce((a,b)=>a+b,0)/vals.length;
      });
    });
    return { quarters, aggregated, entities };
  }

  function generateColors(count) {
    const base = [
      'rgb(0, 0, 0)',
      'rgb(220, 53, 69)',
      'rgb(40, 167, 69)',
      'rgb(0, 123, 255)',
      'rgb(255, 193, 7)',
      'rgb(108, 117, 125)',
      'rgb(111, 66, 193)',
      'rgb(255, 87, 34)',
      'rgb(76, 175, 80)',
      'rgb(33, 150, 243)'
    ];
    if (count <= base.length) return base.slice(0, count);
    const out = [...base];
    for (let i = base.length; i < count; i++) {
      const hue = (i * 137.508) % 360;
      out.push(`hsl(${hue},70%,50%)`);
    }
    return out;
  }

  function updateChart() {
    const filteredData = getFilteredData();
    const metric = document.getElementById('selectedMetric').value;
    const filterType = document.getElementById('filterType').value;

    let quarters, datasets;

    if (metric === 'sentiment') {
      quarters = [...new Set(filteredData.map(d => d.quarter))].sort();
      const sentimentMetrics = ['GenAI_Risk','GenAI_Adoption','GenAI_Opportunity'];
      let aggregated = {};
      if (filterType === 'all') {
        sentimentMetrics.forEach(m => {
          aggregated[m] = {};
          quarters.forEach(q => {
            const qd = filteredData.filter(d => d.quarter === q);
            const vals = qd.map(d => d[m]).filter(v => v !== null && v !== undefined && !isNaN(v));
            if (vals.length) aggregated[m][q] = vals.reduce((a,b)=>a+b,0)/vals.length;
          });
        });
      } else {
        const selectedValue = document.getElementById('filterValue').selectedOptions[0].value;
        sentimentMetrics.forEach(m => {
          aggregated[m] = {};
          quarters.forEach(q => {
            const qd = filteredData.filter(d => d.quarter === q && d[filterType] === selectedValue);
            const vals = qd.map(d => d[m]).filter(v => v !== null && v !== undefined && !isNaN(v));
            if (vals.length) aggregated[m][q] = vals.reduce((a,b)=>a+b,0)/vals.length;
          });
        });
      }
      datasets = sentimentMetrics.map(m => ({
        label: metricLabels[m],
        data: quarters.map(q => aggregated[m][q] !== undefined ? aggregated[m][q] : null),
        borderColor: colors[m],
        backgroundColor: colors[m] + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1
      }));
    } else {
      let aggregated, entities;
      if (filterType === 'all') {
        quarters = [...new Set(filteredData.map(d => d.quarter))].sort();
        aggregated = { 'All Companies': {} };
        entities = ['All Companies'];
        quarters.forEach(q => {
          const qd = filteredData.filter(d => d.quarter === q);
          const vals = qd.map(d => d[metric]).filter(v => v !== null && v !== undefined && !isNaN(v));
          if (vals.length) aggregated['All Companies'][q] = vals.reduce((a,b)=>a+b,0)/vals.length;
        });
      } else {
        const result = aggregateDataByEntity(filteredData, metric, filterType);
        quarters = result.quarters;
        aggregated = result.aggregated;
        entities = result.entities;
      }
      const entityColors = generateColors(Object.keys(aggregated).length);
      datasets = Object.keys(aggregated).map((entity, i) => ({
        label: entity,
        data: quarters.map(q => aggregated[entity][q] !== undefined ? aggregated[entity][q] : null),
        borderColor: entityColors[i],
        backgroundColor: entityColors[i] + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1
      }));
    }

    updateStats(filteredData, quarters);

    const config = {
      type: 'line',
      data: { labels: quarters, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { boxWidth: 12, padding: 15, font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            cornerRadius: 4,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: {
              label: ctx => ctx.dataset.label + ': ' +
                (ctx.parsed.y !== null && ctx.parsed.y !== undefined
                  ? ctx.parsed.y.toFixed(3)
                  : 'N/A')
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 45 }
          },
          y: {
            grid: { color: '#f0f0f0', drawBorder: false },
            ticks: {
              font: { size: 11 },
              callback: v => Number.isFinite(v) ? v.toFixed(2) : v
            },
            title: {
              display: true,
              text: metric === 'sentiment'
                ? 'Sentiment Scores (%)'
                : metricLabels[metric] + ' (%)',
              font: { size: 11, weight: 'normal' }
            }
          }
        }
      }
    };

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart').getContext('2d'), config);
  }

  function updateStats(filteredData, quarters) {
    const companies = new Set(filteredData.map(d => d.firm)).size;
    document.getElementById('companyCount').textContent = companies.toLocaleString();
    document.getElementById('quarterCount').textContent = quarters.length;
    document.getElementById('dataPoints').textContent = filteredData.length.toLocaleString();
  }

  document.getElementById('updateChart').addEventListener('click', updateChart);

  loadData();
});
