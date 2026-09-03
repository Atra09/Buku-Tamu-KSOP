import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { BarChart2 } from 'lucide-react';

const MonthlyBarChart = ({ weeklyStats = [], monthlyStats = [] }) => {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'monthly'

  const activeData = viewMode === 'weekly' ? weeklyStats : monthlyStats;

  const categories = Array.isArray(activeData) && activeData.length > 0
    ? activeData.map(item => item.label || item.day || item.month || '')
    : ['-'];

  const seriesValues = Array.isArray(activeData) && activeData.length > 0
    ? activeData.map(item => typeof item.count === 'number' ? item.count : 0)
    : [0];

  const series = [
    {
      name: 'Jumlah Tamu',
      type: 'column',
      data: seriesValues
    },
    {
      name: 'Jumlah Tamu',
      type: 'line',
      data: seriesValues
    }
  ];

  const maxVal = Math.max(...seriesValues, 0);

  const options = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      type: 'line',
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#4F46E5', '#4F46E5'], // Single solid blue/indigo color matching reference
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 8,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 3],
      curve: 'smooth'
    },
    markers: {
      size: [0, 7],
      colors: ['#FFFFFF'],
      strokeColors: '#4F46E5',
      strokeWidth: 2.5,
      hover: { size: 7, sizeOffset: 0 }
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 }
      }
    },
    yaxis: {
      min: 0,
      max: maxVal > 0 ? maxVal + 2 : 5,
      tickAmount: maxVal > 0 && maxVal <= 10 ? maxVal + 1 : 5,
      labels: {
        formatter: (val) => Math.floor(val),
        style: { colors: '#64748B', fontSize: '12px', fontWeight: 500 }
      }
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      customLegendItems: ['Jumlah Tamu'],
      markers: {
        fillColors: ['#4F46E5']
      },
      fontSize: '12px',
      fontWeight: 600
    },
    tooltip: {
      shared: true,
      intersect: false,
      followCursor: false,
      offsetY: -10,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        if (dataPointIndex == null || dataPointIndex < 0 || seriesIndex > 0) return '';
        const label = categories[dataPointIndex] || '';
        const val = seriesValues[dataPointIndex] ?? 0;

        // Custom Mini Card Tooltip matching Gambar 4 identically (Single Card)
        return `
          <div style="padding:6px 14px;font-size:12px;font-family:Inter,sans-serif;background:#fff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.08);display:flex;align-items:center;gap:8px;">
            <span style="background:#4F46E5;width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
            <span style="color:#334155;font-weight:500;">${label}: <strong style="color:#0f172a;font-weight:700;">${val} tamu</strong></span>
          </div>
        `;
      }
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <style>{`
        .apexcharts-canvas .apexcharts-xcrosshairs { fill: transparent !important; }
        .apexcharts-canvas .apexcharts-tooltip,
        .apexcharts-canvas .apexcharts-tooltip::before,
        .apexcharts-canvas .apexcharts-tooltip::after {
          pointer-events: none !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .apexcharts-canvas .apexcharts-bar-area:hover { filter: brightness(0.92); }
      `}</style>
      
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Statistik Kunjungan Tamu</h3>
            <p className="text-xs text-slate-500 font-semibold">
              {viewMode === 'weekly' ? 'Tren harian (Senin - Minggu)' : 'Tren bulanan (12 bulan tahun ini)'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white text-sky-700 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Harian (1 Minggu)
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-white text-sky-700 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      <div className="flex-grow min-h-[300px]">
        <Chart options={options} series={series} type="line" height={320} />
      </div>
    </div>
  );
};

export default MonthlyBarChart;
