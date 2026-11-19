import React from 'react';
import { ConceptStat } from '../types';
import { CONCEPTS_META } from '../data/snippets';
import { Zap, Target } from 'lucide-react';

interface StatsExportCardProps {
  ref?: React.Ref<HTMLDivElement>;
  streak: number;
  stats: ConceptStat[];
  totalAttempts: number;
  globalAccuracy: number;
  primaryBlindSpot: ConceptStat | null;
}

/**
 * Tarjeta de ancho fijo pensada solo para exportarse como PNG.
 * Replica las estadísticas visibles del Mapa de Puntos Ciegos (sin botones)
 * y agrega la racha de días de práctica.
 */
export const StatsExportCard: React.FC<StatsExportCardProps> = ({
  ref,
  streak,
  stats,
  totalAttempts,
  globalAccuracy,
  primaryBlindSpot
}) => {
  const masteredCount = stats.filter(s => s.status === 'mastered').length;
  const generatedAt = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div
      ref={ref}
      className="bg-[#FAFAFA] text-[#0A0A0A] p-12 space-y-7"
      style={{ width: 1080 }}
    >
      {/* Encabezado */}
      <div className="flex items-end justify-between border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="text-xl font-bold tracking-tight">
            Trace<span className="text-[#FF0033] text-red-elegant text-2xl">Gym</span>
          </div>
          <div className="flex items-center space-x-2.5 mt-3">
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB]">
              <Target className="w-5 h-5 text-[#FF0033]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mapa de Puntos Ciegos</h1>
          </div>
          <p className="text-sm text-[#71717A] mt-2">
            Diagnóstico de precisión en lectura y deducción de código para parciales escritos
          </p>
        </div>
        <div className="text-right text-xs font-mono text-[#71717A]">
          <div className="uppercase tracking-wider">Generado el</div>
          <div className="text-sm font-semibold text-[#0A0A0A] mt-0.5">{generatedAt}</div>
        </div>
      </div>

      {/* Racha */}
      <div className="rounded-2xl bg-[#0A0A0A] text-white px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="p-3.5 rounded-2xl bg-white/10">
            <Zap className="w-9 h-9 text-[#FF0033] fill-[#FF0033]" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#A1A1AA] font-semibold">Racha de práctica</div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-5xl font-bold font-mono">{streak}</span>
              <span className="text-lg text-[#D4D4D8]">{streak === 1 ? 'día' : 'días'} consecutivos</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-[#A1A1AA] max-w-xs text-right">
          Días seguidos entrenando el trazado mental de código sin ejecutarlo
        </p>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Retos Trazados</span>
          <div className="text-3xl font-bold font-mono">{totalAttempts}</div>
          <span className="text-[11px] text-[#A1A1AA]">en el navegador</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Tasa de Acierto Global</span>
          <div className={`text-3xl font-bold font-mono ${globalAccuracy >= 75 ? 'text-emerald-600' : 'text-[#FF0033] text-red-elegant'}`}>
            {globalAccuracy}%
          </div>
          <span className="text-[11px] text-[#A1A1AA]">sin ejecutar el código</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Conceptos Dominados</span>
          <div className="text-3xl font-bold font-mono">
            {masteredCount} <span className="text-sm font-normal text-[#71717A]">/ {stats.length}</span>
          </div>
          <span className="text-[11px] text-[#A1A1AA]">≥ 80% de aciertos</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Punto Más Débil</span>
          <div className="text-xl font-bold text-[#FF0033] text-red-elegant truncate">
            {primaryBlindSpot ? CONCEPTS_META[primaryBlindSpot.concept].label : 'Por descubrir'}
          </div>
          <span className="text-[11px] text-[#A1A1AA]">
            {primaryBlindSpot ? `${primaryBlindSpot.accuracyRate}% de acierto` : 'Realiza más intentos'}
          </span>
        </div>
      </div>

      {/* Rendimiento por concepto */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider font-bold text-[#71717A]">
          Rendimiento por Concepto Clave
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map(stat => {
            const meta = CONCEPTS_META[stat.concept];
            const hasAttempts = stat.totalAttempts > 0;
            return (
              <div key={stat.concept} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-tight">{meta.label}</h3>
                    <p className="text-[11px] text-[#71717A] mt-0.5 line-clamp-2">{meta.shortDesc}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                    stat.status === 'mastered'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : stat.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : stat.status === 'critical'
                      ? 'bg-[#FFF0F2] text-[#FF0033] border border-[#FFCCD3] text-red-elegant text-xs'
                      : 'bg-[#F4F4F5] text-[#71717A]'
                  }`}>
                    {stat.status === 'mastered' ? 'Dominado' : stat.status === 'warning' ? 'Regular' : stat.status === 'critical' ? 'Crítico' : 'Sin datos'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#71717A]">Precisión</span>
                    <span className={`font-bold ${stat.accuracyRate >= 80 ? 'text-emerald-600' : stat.accuracyRate < 50 && hasAttempts ? 'text-[#FF0033] text-red-elegant text-sm' : 'text-[#0A0A0A]'}`}>
                      {hasAttempts ? `${stat.accuracyRate}%` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-[#F4F4F5] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stat.accuracyRate >= 80 ? 'bg-emerald-500' : stat.accuracyRate >= 50 ? 'bg-amber-500' : 'bg-[#FF0033]'
                      }`}
                      style={{ width: hasAttempts ? `${stat.accuracyRate}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                  <span>Aciertos: <strong className="text-[#0A0A0A] font-medium">{stat.successes}</strong> / {stat.totalAttempts}</span>
                  <span>Fallos: <strong className="text-[#FF0033] font-medium text-red-elegant text-xs">{stat.totalAttempts - stat.successes}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-5 text-xs text-[#71717A]">
        <span className="text-red-elegant text-[#FF0033] text-sm">«Entrena la mente para predecir código sin correrlo»</span>
        <span className="font-mono text-[#888888]">100% Local (Pyodide WASM)</span>
      </div>
    </div>
  );
};
