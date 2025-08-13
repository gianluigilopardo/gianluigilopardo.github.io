// GenAI Visualization Script (enhanced with top-10 & group company logic)

(function() {
    'use strict';
    
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

    function withAlpha(rgbString, alpha = 0.15) {
        if (!rgbString) return rgbString;
        if (!rgbString.startsWith('rgb(')) return rgbString; // simple guard
        // Convert 'rgb(r, g, b)' to 'rgba(r, g, b, alpha)'
        return rgbString.replace(/^rgb\(/,'rgba(').replace(/\)$/ , `, ${alpha})`);
    }
    
    function applyAlpha(color, alpha) {
        if (!color) return color;
        if (color.startsWith('rgba(')) {
            return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),\s*([^)]+)\)/, (m,r,g,b) => `rgba(${r.trim()},${g.trim()},${b.trim()},${alpha})`);
        }
        if (color.startsWith('rgb(')) {
            return color.replace(/^rgb\((.*)\)$/,'rgba($1, '+alpha+')');
        }
        if (color.startsWith('hsla(')) {
            return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),\s*([^)]+)\)/, (m,h,s,l) => `hsla(${h.trim()},${s.trim()},${l.trim()},${alpha})`);
        }
        if (color.startsWith('hsl(')) {
            return color.replace(/^hsl\((.*)\)$/,'hsla($1, '+alpha+')');
        }
        if (color.startsWith('#')) {
            let hex = color.slice(1);
            if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
            const num = parseInt(hex,16);
            const r = (num >> 16) & 255;
            const g = (num >> 8) & 255;
            const b = num & 255;
            return `rgba(${r},${g},${b},${alpha})`;
        }
        return color;
    }

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

    const yAxisTitlePlugin = {
        id: 'yAxisTitlePlugin',
        afterDraw(chart, args, opts) {
            const pluginOpts = chart.config.options.plugins.yAxisTitlePlugin;
            if (!pluginOpts || !pluginOpts.text) return;
            const { ctx, chartArea, scales } = chart;
            if (!chartArea) return;
            let leftMost = chartArea.left;
            if (scales && scales.y) leftMost = scales.y.left;
            ctx.save();
            ctx.font = (pluginOpts.fontSize || 12) + 'px ' + (pluginOpts.fontFamily || 'sans-serif');
            ctx.fillStyle = pluginOpts.color || '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const x = leftMost - (pluginOpts.offset || 40);
            const y = (chartArea.top + chartArea.bottom) / 2;
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(pluginOpts.text, 0, 0);
            ctx.restore();
        }
    };

    const canvasBackgroundPlugin = {
        id: 'canvasBackgroundPlugin',
        beforeDraw(chart, args, opts) {
            const { ctx, width, height } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = (opts && opts.color) || '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    };
    
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
                } catch (_) { /* ignore */ }
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
                    data = data.filter(row => row.quarter && row.ticker);
                    data.sort((a, b) => {
                        if (a.quarter !== b.quarter) return a.quarter.localeCompare(b.quarter);
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
        const groupToggle = document.getElementById('groupCompaniesToggle');
        const showGroupCompanies = document.getElementById('showGroupCompanies');
        if (!filterType) return;
        filterType.addEventListener('change', function() {
            if (this.value === 'all') {
                if (filterValueGroup) filterValueGroup.style.display = 'none';
            } else {
                if (filterValueGroup) filterValueGroup.style.display = 'block';
                populateFilterValues(this.value);
            }
            updateSentimentOption();
            updateToggle();
        });
        if (filterValue) filterValue.addEventListener('change', updateSentimentOption);
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterOptions(this.value.toLowerCase());
            });
        }
        showGroupCompanies?.addEventListener('change',()=>updateChart());
        updateSentimentOption();
        updateToggle();
    }
    
    function updateToggle(){
        const filterType = document.getElementById('filterType');
        const groupToggle = document.getElementById('groupCompaniesToggle');
        const showGroupCompanies = document.getElementById('showGroupCompanies');
        const filterValue = document.getElementById('filterValue');
        if(!filterType) return;
        let show=false;
        if(filterType.value==='sector' || filterType.value==='industry'){
            const selCount = filterValue? Array.from(filterValue.selectedOptions).length : 0;
            show = selCount===1; // exactly one selection only
        }
        if(show){
            if(groupToggle) groupToggle.style.display='block';
        } else {
            if(groupToggle) groupToggle.style.display='none';
            if(showGroupCompanies) showGroupCompanies.checked=false;
        }
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
                const values = quarterData.map(d => d[metric]).filter(v => v !== null && v !== undefined && !isNaN(v));
                if (values.length > 0) {
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    aggregated[entity][quarter] = parseFloat(avg.toFixed(3));
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
        if (count <= baseColors.length) return baseColors.slice(0, count);
        const extended = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = (i * 137.508) % 360;
            extended.push(`hsl(${hue}, 70%, 50%)`);
        }
        return extended;
    }

    // Legend hover highlight helpers
    function storeOriginalDatasetStyles(ds) {
        if (!ds._originalStyle) {
            ds._originalStyle = {
                borderColor: ds.borderColor,
                backgroundColor: ds.backgroundColor,
                borderWidth: ds.borderWidth,
                pointRadius: ds.pointRadius,
                pointBackgroundColor: ds.pointBackgroundColor,
                tension: ds.tension
            };
        }
    }

    function restoreDatasetStyles(ds) {
        if (ds._originalStyle) {
            Object.assign(ds, ds._originalStyle);
        }
    }

    function highlightDataset(index) {
        if (!chart) return;
        chart.data.datasets.forEach((ds, i) => {
            storeOriginalDatasetStyles(ds);
            if (chart.isDatasetVisible(i)) {
                if (i === index) {
                    ds.borderWidth = (ds._originalStyle.borderWidth || 2) + 1;
                    ds.pointRadius = (ds._originalStyle.pointRadius || 3) + 1;
                    ds.tension = 0.25;
                    // Keep original vivid colors
                    ds.borderColor = ds._originalStyle.borderColor;
                    ds.pointBackgroundColor = ds._originalStyle.pointBackgroundColor;
                    ds.backgroundColor = applyAlpha(ds._originalStyle.backgroundColor || ds.borderColor, 0.25);
                } else {
                    // Fade others
                    ds.borderColor = applyAlpha(ds._originalStyle.borderColor, 0.25);
                    ds.pointBackgroundColor = applyAlpha(ds._originalStyle.pointBackgroundColor, 0.25);
                    ds.backgroundColor = applyAlpha(ds._originalStyle.backgroundColor || ds.borderColor, 0.05);
                    ds.pointRadius = Math.max(1, (ds._originalStyle.pointRadius || 3) - 1);
                    ds.borderWidth = Math.max(1, (ds._originalStyle.borderWidth || 2) - 1);
                    ds.tension = 0.1;
                }
            }
        });
        chart.update('none');
    }

    function resetHighlight() {
        if (!chart) return;
        chart.data.datasets.forEach(ds => {
            if (ds._originalStyle) {
                restoreDatasetStyles(ds);
            }
        });
        chart.update('none');
    }
    
    function updateChart() {
        const filteredData = getFilteredData();
        const metric = document.getElementById('selectedMetric')?.value || 'GenAI_Exposure';
        const filterType = document.getElementById('filterType')?.value || 'all';
        const showGroupCompanies = document.getElementById('showGroupCompanies')?.checked;
        const limitNoteEl=document.getElementById('limitNote');
        let quarters=[]; let datasets=[]; let limited=false; let aggregated={}; let entities=['All Companies'];

        if(metric==='sentiment'){
            quarters=[...new Set(filteredData.map(d=>d.quarter))].sort();
            const sentimentMetrics=['GenAI_Risk','GenAI_Adoption','GenAI_Opportunity'];
            aggregated={};
            sentimentMetrics.forEach(m=> aggregated[m]={});
            if(filterType==='all'){
                quarters.forEach(q=>{sentimentMetrics.forEach(m=>{const vals=filteredData.filter(d=>d.quarter===q).map(d=>d[m]).filter(v=>v!=null&&!isNaN(v)); if(vals.length){const avg=vals.reduce((a,b)=>a+b,0)/vals.length; aggregated[m][q]=parseFloat(avg.toFixed(3));}});});
            } else {
                const selectedValue=document.getElementById('filterValue')?.selectedOptions[0]?.value;
                quarters.forEach(q=>{sentimentMetrics.forEach(m=>{const vals=filteredData.filter(d=>d.quarter===q && d[filterType]===selectedValue).map(d=>d[m]).filter(v=>v!=null&&!isNaN(v)); if(vals.length){const avg=vals.reduce((a,b)=>a+b,0)/vals.length; aggregated[m][q]=parseFloat(avg.toFixed(3));}});});
            }
            entities=sentimentMetrics;
            datasets=sentimentMetrics.map(m=>({label:metricLabels[m],data:quarters.map(q=>aggregated[m][q]??null),borderColor:colors[m],backgroundColor:withAlpha(colors[m],0.15),borderWidth:2,pointRadius:3,pointBackgroundColor:colors[m],pointHoverRadius:5,tension:0.1,fill:false}));
        } else {
            if(filterType==='all'){
                quarters=[...new Set(filteredData.map(d=>d.quarter))].sort();
                aggregated={'All Companies':{}};
                quarters.forEach(q=>{const vals=filteredData.filter(d=>d.quarter===q).map(d=>d[metric]).filter(v=>v!=null&&!isNaN(v)); if(vals.length){const avg=vals.reduce((a,b)=>a+b,0)/vals.length; aggregated['All Companies'][q]=parseFloat(avg.toFixed(3));}});
                entities=['All Companies'];
            } else {
                let result;
                if(showGroupCompanies && (filterType==='sector'||filterType==='industry')){
                    const selectedValues = Array.from(document.getElementById('filterValue')?.selectedOptions||[]).map(o=>o.value);
                    const subset = selectedValues.length? filteredData.filter(r=>selectedValues.includes(r[filterType])): filteredData;
                    result=aggregateGroupCompanies(subset,metric);
                } else {
                    result=aggregateDataByEntity(filteredData,metric,filterType);
                }
                quarters=result.quarters; aggregated=result.aggregated; entities=result.entities; limited=result.limited;
            }
            const entityColors=generateColors(entities.length);
            datasets=entities.map((ent,i)=>({label:ent,data:quarters.map(q=>aggregated[ent][q]??null),borderColor:entityColors[i],backgroundColor:withAlpha(entityColors[i],0.15),borderWidth:2,pointRadius:3,pointBackgroundColor:entityColors[i],pointHoverRadius:5,tension:0.1,fill:false}));
        }

        if(limitNoteEl) limitNoteEl.textContent = limited? 'Showing top 10 lines by average value.' : '';

        updateStats(filteredData,quarters);

        // reuse existing rendering logic (simplified)
        if(chart) chart.destroy();
        const isDark = document.documentElement.getAttribute('data-theme')==='dark';
        const gridColor=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)';
        const textColor=isDark?'#e5e7eb':'#333';
        const yAxisLabel=getYAxisLabel(metric);
        const ctx=document.getElementById('chart')?.getContext('2d'); if(!ctx) return;
        chart=new Chart(ctx,{type:'line',data:{labels:quarters,datasets},plugins:[yAxisTitlePlugin,canvasBackgroundPlugin],options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},layout:{padding:{left:55,right:10,top:5,bottom:0}},plugins:{legend:{display:true,position:'top',labels:{boxWidth:12,padding:15,font:{size:12},color:textColor,usePointStyle:true,pointStyle:'line'},onHover:(evt,it)=>{if(it&&it.datasetIndex!=null){evt.native&&(evt.native.target.style.cursor='pointer'); highlightDataset(it.datasetIndex);}},onLeave:(evt)=>{evt.native&&(evt.native.target.style.cursor='default'); resetHighlight();}},tooltip:{backgroundColor:isDark?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.8)',titleColor:isDark?'#000':'#fff',bodyColor:isDark?'#000':'#fff',padding:12,cornerRadius:4,titleFont:{size:12},bodyFont:{size:12},callbacks:{label:ctx=>ctx.dataset.label+': '+(ctx.parsed.y!=null?ctx.parsed.y.toFixed(3):'N/A')}},yAxisTitlePlugin:{text:yAxisLabel,color:textColor,fontSize:12,offset:40},canvasBackgroundPlugin:{color:isDark?'#1c1c1c':'#ffffff'}},scales:{x:{grid:{display:false,color:gridColor},ticks:{font:{size:11},maxRotation:45,minRotation:45,color:textColor}},y:{grid:{color:gridColor,drawBorder:false},ticks:{font:{size:11},callback:v=>Number(v).toFixed(3),color:textColor},title:{display:true,text:yAxisLabel,font:{size:12,weight:'normal'},color:textColor}}}}});
        createDownloadButtonIfNeeded();
    }

    // Expose new updateChart
    window.updateChart=updateChart;

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

    // NEW helper: rank & limit entities to top 10 by average metric
    function rankAndLimitEntities(entities, aggregated) {
        const avgs = entities.map(e => {
            const vals = Object.values(aggregated[e]||{}).filter(v=>v!=null&&!isNaN(v));
            const avg = vals.length? vals.reduce((a,b)=>a+b,0)/vals.length : 0; return {e,avg};
        }).sort((a,b)=>b.avg-a.avg).slice(0,10).map(o=>o.e);
        return avgs;
    }

    // Modify aggregateDataByEntity to apply top-10 logic
    const _origAggregate = aggregateDataByEntity; // keep reference if needed
    function aggregateDataByEntity(filteredData, metric, filterType) {
        const quarters = [...new Set(filteredData.map(d=>d.quarter))].sort();
        const entities = [...new Set(filteredData.map(d=>d[filterType]))].filter(e=>e).sort();
        const aggregated = {};
        entities.forEach(ent=>{aggregated[ent]={}; quarters.forEach(q=>{const vals=filteredData.filter(d=>d.quarter===q && d[filterType]===ent).map(d=>d[metric]).filter(v=>v!=null&&!isNaN(v)); if(vals.length){const avg= vals.reduce((a,b)=>a+b,0)/vals.length; aggregated[ent][q]=parseFloat(avg.toFixed(3));}});});
        const ranked = entities.map(e=>{const vals=Object.values(aggregated[e]); const avg=vals.length? vals.reduce((a,b)=>a+b,0)/vals.length:0; return {e,avg};}).sort((a,b)=>b.avg-a.avg);
        const limitedEntities = ranked.slice(0,10).map(o=>o.e);
        const limitedFlag = entities.length>10;
        // prune
        Object.keys(aggregated).forEach(k=>{if(!limitedEntities.includes(k)) delete aggregated[k];});
        return {quarters, aggregated, entities: limitedEntities, limited: limitedFlag};
    }

    // Add group company logic for sector/industry when checkbox ticked
    function aggregateGroupCompanies(filteredData, metric){
        const quarters=[...new Set(filteredData.map(d=>d.quarter))].sort();
        const firms=[...new Set(filteredData.map(d=>d.firm))];
        const aggregated={};
        firms.forEach(f=>{aggregated[f]={}; quarters.forEach(q=>{const vals=filteredData.filter(d=>d.quarter===q && d.firm===f).map(d=>d[metric]).filter(v=>v!=null&&!isNaN(v)); if(vals.length){const avg=vals.reduce((a,b)=>a+b,0)/vals.length; aggregated[f][q]=parseFloat(avg.toFixed(3));}});});
        const ranked=firms.map(f=>{const vals=Object.values(aggregated[f]); const avg=vals.length? vals.reduce((a,b)=>a+b,0)/vals.length:0; return {f,avg};}).sort((a,b)=>b.avg-a.avg);
        const limitedFirms=ranked.slice(0,10).map(o=>o.f);
        const limitedFlag = firms.length>10;
        Object.keys(aggregated).forEach(k=>{if(!limitedFirms.includes(k)) delete aggregated[k];});
        return {quarters, aggregated, entities: limitedFirms, limited: limitedFlag};
    }
    
    // Download button
    function createDownloadButtonIfNeeded() {
        // If already present, do nothing
        if (document.getElementById('downloadChart')) return;
        // Prefer explicit container, else fallback to canvas parent
        let chartContainer = document.querySelector('.chart-container');
        const chartCanvas = document.getElementById('chart');
        if (!chartContainer && chartCanvas) chartContainer = chartCanvas.parentElement;
        if (!chartContainer) return;
        const wrapper = document.createElement('div');
        wrapper.style.margin = '10px 0 0';
        wrapper.style.textAlign = 'right';
        const btn = document.createElement('button');
        btn.id = 'downloadChart';
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline-secondary';
        btn.textContent = 'Download Chart (PNG)';
        btn.addEventListener('click', () => {
            if (!chart) return;
            try {
                const metric = document.getElementById('selectedMetric')?.value || 'GenAI_Exposure';
                const filterType = document.getElementById('filterType')?.value || 'all';
                let filterSnippet = filterType;
                if (filterType !== 'all') {
                    const selectedVals = Array.from(document.getElementById('filterValue')?.selectedOptions || [])
                        .map(o => o.value).slice(0,3).join('_').replace(/[^a-zA-Z0-9_-]/g,'');
                    if (selectedVals) filterSnippet += '-' + selectedVals;
                }
                const dateStamp = new Date().toISOString().slice(0,10);
                const filename = `genai_${metric}_${filterSnippet}_${dateStamp}.png`;
                chart.update('none');
                const link = document.createElement('a');
                link.download = filename;
                link.href = chart.toBase64Image('image/png', 1);
                link.click();
            } catch (e) {
                console.error('Error exporting chart:', e);
                alert('Unable to download chart image.');
            }
        });
        wrapper.appendChild(btn);
        chartContainer.insertAdjacentElement('afterend', wrapper);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const updateButton = document.getElementById('updateChart');
        if (updateButton) updateButton.addEventListener('click', updateChart);
        createDownloadButtonIfNeeded();
        loadData();
    });
})();
