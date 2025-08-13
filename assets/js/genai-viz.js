// GenAI Visualization Script for Jekyll al-folio theme
// This script handles the interactive GenAI exposure & sentiment analysis chart

(function() {
    'use strict';
    
    // Global variables
    let data = [];
    let chart = null;
    
    // Color palette (base line colors)
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

    // Helper: add alpha to an rgb() string
    function withAlpha(rgbString, alpha = 0.15) {
        // Expects 'rgb(r, g, b)'
        return rgbString.replace(/^rgb\(/, 'rgba(').replace(/\)$/, `, ${alpha})`);
    }

    // Helper: Y-axis label text (this is the ONLY place to change the wording)
    function getYAxisLabel(metric) {
        if (metric === 'sentiment') return 'GenAI Sentiment (%)';
        switch (metric) {
            case 'GenAI_Exposure': return 'GenAI Exposure (%)';
            case 'GenAI_Risk': return 'GenAI Risk (%)';
            case 'GenAI_Adoption': return 'GenAI Adoption (%)';
            case 'GenAI_Opportunity': return 'GenAI Opportunity (%)';
            default: return 'Value (%)';
        }
    }
    
    // Load data from CSV
    async function loadData() {
        try {
            const possiblePaths = [
                '/exposure/genai_trends.csv',
                '/assets/data/genai_trends.csv',
                '/genai_html/exposure/genai_trends.csv',
                'exposure/genai_trends.csv'
            ];
            
            let csvContent = null;
            let successPath = null;
            
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        csvContent = await response.text();
                        successPath = path;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!csvContent) {
                throw new Error('Could not find genai_trends.csv file. Please ensure it is uploaded to /assets/data/ or /exposure/ directory.');
            }
            
            console.log(`Successfully loaded data from: ${successPath}`);
            
            Papa.parse(csvContent, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: function(results) {
                    data = results.data;
                    
                    // Clean and validate data
                    data = data.filter(row => row.quarter && row.ticker);
                    
                    // Sort by quarter then ticker
                    data.sort((a, b) => {
                        if (a.quarter !== b.quarter) {
                            return a.quarter.localeCompare(b.quarter);
                        }
                        return a.ticker.localeCompare(b.ticker);
                    });
                    
                    console.log(`Processing ${data.length} valid rows`);
                    
                    initializeFilters();
                    updateChart();
                    const loadingEl = document.getElementById('loading');
                    if (loadingEl) loadingEl.style.display = 'none';
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    showError('Error parsing CSV data: ' + error.message);
                }
            });
        } catch (error) {
            console.error('Error loading data:', error);
            showError(error.message);
        }
    }
    
    function showError(message) {
        const loadingEl = document.getElementById('loading');
        if (!loadingEl) return;
        loadingEl.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
    
    function initializeFilters() {
        const filterType = document.getElementById('filterType');
        const filterValueGroup = document.getElementById('filterValueGroup');
        const filterValue = document.getElementById('filterValue');
        const searchInput = document.getElementById('searchInput');
        
        if (!filterType) return;
        
        filterType.addEventListener('change', function() {
            if (this.value === 'all') {
                if (filterValueGroup) filterValueGroup.style.display = 'none';
            } else {
                if (filterValueGroup) filterValueGroup.style.display = 'block';
                populateFilterValues(this.value);
            }
            updateSentimentOption();
        });
        
        if (filterValue) {
            filterValue.addEventListener('change', updateSentimentOption);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterOptions(this.value.toLowerCase());
            });
        }
        
        updateSentimentOption();
    }
    
    function filterOptions(searchTerm) {
        const filterValue = document.getElementById('filterValue');
        if (!filterValue) return;
        const options = filterValue.querySelectorAll('option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
    
    function updateSentimentOption() {
        const filterTypeVal = document.getElementById('filterType')?.value;
        const filterValue = document.getElementById('filterValue');
        const sentimentOption = document.getElementById('sentimentOption');
        const selectedMetricEl = document.getElementById('selectedMetric');
        
        if (!sentimentOption || !selectedMetricEl) return;
        
        if (filterTypeVal === 'all' || (filterValue && filterValue.selectedOptions.length === 1)) {
            sentimentOption.style.display = 'block';
        } else {
            sentimentOption.style.display = 'none';
            if (selectedMetricEl.value === 'sentiment') {
                selectedMetricEl.value = 'GenAI_Exposure';
            }
        }
    }
    
    function populateFilterValues(type) {
        const filterValue = document.getElementById('filterValue');
        const searchInput = document.getElementById('searchInput');
        if (!filterValue) return;
        filterValue.innerHTML = '';
        if (searchInput) searchInput.value = '';
        
        let values = [];
        if (type === 'sector') {
            values = [...new Set(data.map(d => d.sector))].filter(v => v).sort();
        } else if (type === 'industry') {
            values = [...new Set(data.map(d => d.industry))].filter(v => v).sort();
        } else if (type === 'firm') {
            values = [...new Set(data.map(d => d.firm))].filter(v => v).sort();
        }
        
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterValue.appendChild(option);
        });
        
        if (values.length > 0) {
            filterValue.selectedIndex = 0;
            if (values.length > 1) filterValue.options[1].selected = true;
        }
        
        updateSentimentOption();
    }
    
    function getFilteredData() {
        const filterType = document.getElementById('filterType')?.value;
        const filterValue = document.getElementById('filterValue');
        
        let filtered = data;
        
        if (filterType && filterType !== 'all' && filterValue) {
            const selectedValues = Array.from(filterValue.selectedOptions).map(opt => opt.value);
            if (selectedValues.length > 0) {
                filtered = data.filter(row => selectedValues.includes(row[filterType]));
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
            quarters.forEach(quarter => {
                const quarterData = filteredData.filter(d => d.quarter === quarter && d[filterType] === entity);
                const values = quarterData
                    .map(d => d[metric])
                    .filter(v => v !== null && v !== undefined && !isNaN(v));
                if (values.length > 0) {
                    aggregated[entity][quarter] = values.reduce((a, b) => a + b, 0) / values.length;
                }
            });
        });
        
        return { quarters, aggregated, entities };
    }
    
    function generateColors(count) {
        const baseColors = [
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
        
        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }
        
        const extended = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = (i * 137.508) % 360;
            extended.push(`hsl(${hue}, 70%, 50%)`);
        }
        return extended;
    }
    
    function updateChart() {
        const filteredData = getFilteredData();
        const metric = document.getElementById('selectedMetric')?.value || 'GenAI_Exposure';
        const filterType = document.getElementById('filterType')?.value || 'all';
        
        let quarters = [];
        let aggregated = {};
        let entities = [];
        let datasets = [];
        
        if (metric === 'sentiment') {
            quarters = [...new Set(filteredData.map(d => d.quarter))].sort();
            const sentimentMetrics = ['GenAI_Risk', 'GenAI_Adoption', 'GenAI_Opportunity'];
            aggregated = {};
            
            if (filterType === 'all') {
                sentimentMetrics.forEach(sentimentMetric => {
                    aggregated[sentimentMetric] = {};
                    quarters.forEach(quarter => {
                        const quarterData = filteredData.filter(d => d.quarter === quarter);
                        const values = quarterData
                            .map(d => d[sentimentMetric])
                            .filter(v => v !== null && v !== undefined && !isNaN(v));
                        if (values.length > 0) {
                            aggregated[sentimentMetric][quarter] = values.reduce((a, b) => a + b, 0) / values.length;
                        }
                    });
                });
            } else {
                const selectedValue = document.getElementById('filterValue')?.selectedOptions[0]?.value;
                sentimentMetrics.forEach(sentimentMetric => {
                    aggregated[sentimentMetric] = {};
                    quarters.forEach(quarter => {
                        const quarterData = filteredData.filter(d => d.quarter === quarter && d[filterType] === selectedValue);
                        const values = quarterData
                            .map(d => d[sentimentMetric])
                            .filter(v => v !== null && v !== undefined && !isNaN(v));
                        if (values.length > 0) {
                            aggregated[sentimentMetric][quarter] = values.reduce((a, b) => a + b, 0) / values.length;
                        }
                    });
                });
            }
            
            datasets = ['GenAI_Risk', 'GenAI_Adoption', 'GenAI_Opportunity'].map(sentimentMetric => ({
                label: metricLabels[sentimentMetric],
                data: quarters.map(q => aggregated[sentimentMetric][q] !== undefined ? aggregated[sentimentMetric][q] : null),
                borderColor: colors[sentimentMetric],
                backgroundColor: withAlpha(colors[sentimentMetric], 0.15),
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: colors[sentimentMetric],
                pointHoverRadius: 5,
                tension: 0.1,
                fill: false
            }));
            
        } else {
            if (filterType === 'all') {
                quarters = [...new Set(filteredData.map(d => d.quarter))].sort();
                aggregated = { 'All Companies': {} };
                entities = ['All Companies'];
                
                quarters.forEach(quarter => {
                    const quarterData = filteredData.filter(d => d.quarter === quarter);
                    const values = quarterData
                        .map(d => d[metric])
                        .filter(v => v !== null && v !== undefined && !isNaN(v));
                    if (values.length > 0) {
                        aggregated['All Companies'][quarter] = values.reduce((a, b) => a + b, 0) / values.length;
                    }
                });
            } else {
                const result = aggregateDataByEntity(filteredData, metric, filterType);
                quarters = result.quarters;
                aggregated = result.aggregated;
                entities = result.entities;
            }
            
            const entityColors = generateColors(entities.length);
            datasets = entities.map((entity, index) => ({
                label: entity,
                data: quarters.map(q => aggregated[entity][q] ?? null),
                borderColor: entityColors[index],
                backgroundColor: withAlpha(entityColors[index], 0.15),
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: entityColors[index],
                pointHoverRadius: 5,
                tension: 0.1,
                fill: false
            }));
        }
        
        updateStats(filteredData, quarters);
        
        // Theme colors
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#e5e7eb' : '#333333';
        const yAxisLabel = getYAxisLabel(metric);
        const majorVersion = (typeof Chart !== 'undefined' && Chart.version) ? parseInt(Chart.version.split('.')[0], 10) : 4;
        
        const chartConfig = {
            type: 'line',
            data: {
                labels: quarters,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                layout: {
                    padding: { left: 8, right: 10, top: 5, bottom: 0 }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: { size: 12 },
                            color: textColor,
                            usePointStyle: true,
                            pointStyle: 'line'
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                        titleColor: isDarkMode ? '#000' : '#fff',
                        bodyColor: isDarkMode ? '#000' : '#fff',
                        padding: 12,
                        cornerRadius: 4,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + (context.parsed.y !== null ? context.parsed.y.toFixed(3) : 'N/A');
                            }
                        }
                    }
                }
            }
        };
        
        // Scales configuration depending on Chart.js major version
        if (majorVersion >= 3) {
            chartConfig.options.scales = {
                x: {
                    grid: {
                        display: false,
                        color: gridColor
                    },
                    ticks: {
                        font: { size: 11 },
                        maxRotation: 45,
                        minRotation: 45,
                        color: textColor
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            return Number(value).toFixed(2);
                        },
                        color: textColor
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 11,
                            weight: 'normal'
                        },
                        color: textColor
                    }
                }
            };
        } else {
            // Backwards compatible (Chart.js 2.x)
            chartConfig.options.scales = {
                xAxes: [{
                    gridLines: {
                        display: false,
                        color: gridColor
                    },
                    ticks: {
                        fontSize: 11,
                        fontColor: textColor,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        fontSize: 11,
                        fontColor: textColor,
                        callback: function(value) {
                            return Number(value).toFixed(2);
                        }
                    },
                    scaleLabel: {
                        display: true,
                        labelString: yAxisLabel,
                        fontSize: 11,
                        fontColor: textColor
                    }
                }]
            };
        }
        
        if (chart) {
            chart.destroy();
        }
        
        const ctx = document.getElementById('chart')?.getContext('2d');
        if (!ctx) return;
        chart = new Chart(ctx, chartConfig);
    }
    
    function updateStats(filteredData, quarters) {
        const companies = [...new Set(filteredData.map(d => d.firm))].length;
        const quarterCount = quarters.length;
        const dataPoints = filteredData.length;
        
        const companyCountEl = document.getElementById('companyCount');
        const quarterCountEl = document.getElementById('quarterCount');
        const dataPointsEl = document.getElementById('dataPoints');
        
        if (companyCountEl) companyCountEl.textContent = companies.toLocaleString();
        if (quarterCountEl) quarterCountEl.textContent = quarterCount;
        if (dataPointsEl) dataPointsEl.textContent = dataPoints.toLocaleString();
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const updateButton = document.getElementById('updateChart');
        if (updateButton) {
            updateButton.addEventListener('click', updateChart);
        }
        loadData();
    });
})();
