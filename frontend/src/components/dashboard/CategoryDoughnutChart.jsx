import React from 'react';
import Chart from 'react-apexcharts';
import { PieChart } from 'lucide-react';

const CategoryDoughnutChart = ({ categoryStats = [], data = [], datas = [] }) => {
  const inputList = (Array.isArray(categoryStats) && categoryStats.length > 0)
    ? categoryStats
    : ((Array.isArray(datas) && datas.length > 0) ? datas : (Array.isArray(data) && data.length > 0 ? data : []));

  const seriesData = inputList.length > 0
    ? inputList.map(d => (typeof d.value === 'number' ? d.value : (d.count || d.jumlah || 0)))
    : [0];

  const seriesLabels = inputList.length > 0
    ? inputList.map(d => d.label || d.name || d.kategori || d.kategori_asal || 'Kategori')
    : ['Belum Ada Data'];

  const totalGuests = seriesData.reduce((acc, curr) => acc + curr, 0);

  const options = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif'
    },
    colors: ['#0284C7', '#059669', '#D97706', '#8B5CF6', '#6366F1', '#EC4899'],
    labels: seriesLabels,
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontWeight: 600,
      markers: {
        radius: 6
      }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Asal Tamu',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748B',
              formatter: function () {
                return totalGuests;
              }
            }
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#FFFFFF']
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} Tamu`
      }
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Distribusi Kategori Asal</h3>
          <p className="text-xs text-slate-500 font-semibold">Persentase asal instansi/masyarakat pengunjung</p>
        </div>
      </div>

      <div className="flex flex-grow w-full items-center justify-center min-h-[300px]">
        <Chart options={options} series={seriesData} type="donut" height={320} width="100%" />
      </div>
    </div>
  );
};

export default CategoryDoughnutChart;
