import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Concept, ConceptStat, Attempt } from '../types';
import { CONCEPTS_META } from '../data/snippets';
import { 
  getConceptStats, 
  getAttempts, 
  getPrioritizedReviewConcepts, 
  clearAllData 
} from '../services/storage';
import { 
  Target, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Play, 
  Trash2, 
  RefreshCw, 
  Filter,
  ImageDown,
  LoaderCircle
} from 'lucide-react';
import { StatsExportCard } from './StatsExportCard';

interface BlindSpotsMapProps {
  streak: number;
  onStartPracticeConcept: (concept: Concept) => void;
  onStartReviewSession: () => void;
}

export const BlindSpotsMap: React.FC<BlindSpotsMapProps> = ({
  streak,
  onStartPracticeConcept,
  onStartReviewSession
}) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [stats, setStats] = useState<ConceptStat[]>(getConceptStats());
  const [attempts, setAttempts] = useState<Attempt[]>(getAttempts());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const prioritizedList = getPrioritizedReviewConcepts();

  // Summary Metrics
  const totalAttempts = attempts.length;
  const totalSuccesses = attempts.filter(a => a.isCorrect).length;
  const globalAccuracy = totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0;
  
  // Find primary blind spot (lowest accuracy with at least 1 attempt)
  const attemptedStats = stats.filter(s => s.totalAttempts > 0);
  attemptedStats.sort((a, b) => a.accuracyRate - b.accuracyRate);
  const primaryBlindSpot = attemptedStats.length > 0 ? attemptedStats[0] : null;

  const handleClearHistory = () => {
    if (window.confirm('¿Seguro que deseas reiniciar todo el historial de práctica local?')) {
      clearAllData();
      setStats(getConceptStats());
      setAttempts([]);
    }
  };

  const handleExportPng = async () => {
    const node = exportRef.current;
    if (!node || isExporting) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      const options = { pixelRatio: 2, backgroundColor: '#FAFAFA' };
      let dataUrl: string;
      try {
        dataUrl = await toPng(node, options);
      } catch (fontError) {
        // Si no se pueden incrustar las fuentes web (p. ej. sin conexión), exporta con fuentes del sistema
        console.warn('No se pudieron incrustar las fuentes, exportando sin ellas', fontError);
        dataUrl = await toPng(node, { ...options, skipFonts: true });
      }
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `tracegym-estadisticas-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error exportando estadísticas a PNG', e);
      window.alert('No se pudo generar la imagen PNG. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredAttempts = attempts.filter(a => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'success') return a.isCorrect;
    if (selectedFilter === 'failure') return !a.isCorrect;
    return a.concept === selectedFilter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn pb-10">
      {/* 1. HEADER & OVERVIEW CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
              <Target className="w-5 h-5 text-[#FF0033]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
              Mapa de Puntos Ciegos
            </h1>
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Diagnóstico de precisión en lectura y deducción de código para parciales escritos
          </p>
        </div>

        {/* Action Buttons: Exportar + Repasar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="btn-secondary text-xs flex items-center space-x-2 py-2 px-5 font-semibold disabled:opacity-60 disabled:pointer-events-none"
            title="Descargar las estadísticas y la racha como imagen PNG"
          >
            {isExporting ? (
              <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageDown className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? 'Generando PNG…' : 'Exportar PNG'}</span>
          </button>

          <button
            onClick={onStartReviewSession}
            className="btn-primary text-xs flex items-center space-x-2 py-2 px-5 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Repasar Conceptos Priorizados</span>
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Snippets Traced */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Retos Trazados</span>
          <div className="text-2xl font-bold font-mono text-[#0A0A0A]">{totalAttempts}</div>
          <span className="text-[10px] text-[#A1A1AA]">en el navegador</span>
        </div>

        {/* Global Accuracy Rate */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Tasa de Acierto Global</span>
          <div className={`text-2xl font-bold font-mono ${globalAccuracy >= 75 ? 'text-emerald-600' : 'text-[#FF0033] text-red-elegant text-3xl'}`}>
            {globalAccuracy}%
          </div>
          <span className="text-[10px] text-[#A1A1AA]">sin ejecutar el código</span>
        </div>

        {/* Mastered Concepts */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Conceptos Dominados</span>
          <div className="text-2xl font-bold font-mono text-[#0A0A0A]">
            {stats.filter(s => s.status === 'mastered').length} <span className="text-xs font-normal text-[#71717A]">/ 6</span>
          </div>
          <span className="text-[10px] text-[#A1A1AA]">≥ 80% de aciertos</span>
        </div>

        {/* Critical Weak Point */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Punto Más Débil</span>
          <div className="text-sm font-bold text-[#FF0033] truncate text-red-elegant text-base">
            {primaryBlindSpot ? CONCEPTS_META[primaryBlindSpot.concept].label : 'Por descubrir'}
          </div>
          <span className="text-[10px] text-[#A1A1AA]">
            {primaryBlindSpot ? `${primaryBlindSpot.accuracyRate}% de acierto` : 'Realiza más intentos'}
          </span>
        </div>
      </div>

      {/* Primary Blind Spot Alert Banner */}
      {primaryBlindSpot && primaryBlindSpot.accuracyRate < 60 && (
        <div className="p-4 rounded-2xl bg-[#FFF5F6] border border-[#FFCCD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#FF0033] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-[#0A0A0A] flex items-center space-x-2">
                <span>Punto Ciego Crítico Detectado: {CONCEPTS_META[primaryBlindSpot.concept].label}</span>
                <span className="text-xs text-[#FF0033] font-mono font-bold text-red-elegant">
                  ({primaryBlindSpot.accuracyRate}% precisión)
                </span>
              </h3>
              <p className="text-xs text-[#B91C1C] mt-0.5 text-red-elegant text-sm">
                «Este concepto es el que más puntos te restaría en un parcial escrito en papel. El sistema lo ha programado para repetición espaciada.»
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartPracticeConcept(primaryBlindSpot.concept)}
            className="btn-danger-outline text-xs whitespace-nowrap px-4 py-1.5 self-start sm:self-center font-semibold"
          >
            Entrenar Ahora
          </button>
        </div>
      )}

      {/* 2. CONCEPT MASTERY BREAKDOWN (6 CARDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-bold text-[#71717A]">
            Rendimiento por Concepto Clave
          </h2>
          <span className="text-xs text-[#A1A1AA]">6 áreas de evaluación de Ingeniería</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(stat => {
            const meta = CONCEPTS_META[stat.concept];
            const hasAttempts = stat.totalAttempts > 0;

            return (
              <div 
                key={stat.concept}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col justify-between hover:border-[#D1D5DB] shadow-xs transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight">{meta.label}</h3>
                      <p className="text-[11px] text-[#71717A] line-clamp-1 mt-0.5">{meta.shortDesc}</p>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
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

                  {/* Accuracy Bar */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#71717A]">Precisión</span>
                      <span className={`font-bold ${stat.accuracyRate >= 80 ? 'text-emerald-600' : stat.accuracyRate < 50 && hasAttempts ? 'text-[#FF0033] text-red-elegant text-sm' : 'text-[#0A0A0A]'}`}>
                        {hasAttempts ? `${stat.accuracyRate}%` : '—'}
                      </span>
                    </div>

                    <div className="w-full bg-[#F4F4F5] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          stat.accuracyRate >= 80 
                            ? 'bg-emerald-500' 
                            : stat.accuracyRate >= 50 
                            ? 'bg-amber-500' 
                            : 'bg-[#FF0033]'
                        }`}
                        style={{ width: hasAttempts ? `${stat.accuracyRate}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Sub stats */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                    <span>Aciertos: <strong className="text-[#0A0A0A] font-medium">{stat.successes}</strong> / {stat.totalAttempts}</span>
                    <span>Fallos: <strong className="text-[#FF0033] font-medium text-red-elegant text-xs">{stat.totalAttempts - stat.successes}</strong></span>
                  </div>
                </div>

                {/* Practice Button */}
                <button
                  onClick={() => onStartPracticeConcept(stat.concept)}
                  className="btn-secondary w-full py-2 text-xs flex items-center justify-center space-x-1.5 font-medium"
                >
                  <Play className="w-3 h-3 text-[#FF0033]" />
                  <span>Entrenar este concepto</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SPACED REPETITION ENGINE (1, 3, 7 DÍAS) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
              <Calendar className="w-4 h-4 text-[#FF0033]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight">
                Repetición Espaciada (Ciclos de 1, 3 y 7 Días)
              </h3>
              <p className="text-xs text-[#71717A]">
                Los conceptos fallados reaparecen automáticamente a intervalos progresivos hasta consolidar el modelo mental
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#71717A]">
            <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse"></span>
            <span>Algoritmo activo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {prioritizedList.map(item => {
            const meta = CONCEPTS_META[item.concept];
            return (
              <div 
                key={item.concept}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  item.isOverdue 
                    ? 'bg-[#FFF5F6] border-[#FFCCD3]' 
                    : 'bg-[#FAFAFA] border-[#E5E7EB]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-[#0A0A0A]">{meta.label}</div>
                  <div className={`text-[11px] mt-0.5 ${item.isOverdue ? 'text-[#DC2626] text-red-elegant text-xs font-semibold' : 'text-[#71717A]'}`}>
                    {item.reason}
                  </div>
                </div>

                <button
                  onClick={() => onStartPracticeConcept(item.concept)}
                  className={`p-1.5 rounded-lg text-xs font-semibold ${
                    item.isOverdue 
                      ? 'bg-[#FF0033] text-white hover:bg-[#E6002E]' 
                      : 'bg-white text-[#71717A] hover:text-[#0A0A0A] border border-[#E5E7EB]'
                  } transition-colors`}
                  title="Practicar"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ATTEMPT HISTORY LOG */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#FF0033]" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#0A0A0A]">
              Historial de Intentos ({filteredAttempts.length})
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter */}
            <div className="flex items-center space-x-1.5 text-xs text-[#71717A]">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-white text-[#0A0A0A] text-xs py-1 px-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none"
              >
                <option value="all">Todos los resultados</option>
                <option value="success">Sólo aciertos</option>
                <option value="failure">Sólo fallos</option>
                {(Object.keys(CONCEPTS_META) as Concept[]).map(c => (
                  <option key={c} value={c}>{CONCEPTS_META[c].label}</option>
                ))}
              </select>
            </div>

            {/* Clear button */}
            {attempts.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-[#71717A] hover:text-[#FF0033] flex items-center space-x-1 transition-colors"
                title="Borrar historial"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {filteredAttempts.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F9FAFB] text-[#71717A] font-mono uppercase text-[10px] border-b border-[#E5E7EB] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Concepto</th>
                  <th className="py-2.5 px-4">Mutación</th>
                  <th className="py-2.5 px-4">Pistas</th>
                  <th className="py-2.5 px-4">Resultado</th>
                  <th className="py-2.5 px-4 text-right">Puntaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-[#374151] font-mono">
                {filteredAttempts.map(attempt => {
                  const dateStr = new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={attempt.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-2.5 px-4 text-[#71717A]">{dateStr}</td>
                      <td className="py-2.5 px-4 font-semibold text-[#0A0A0A]">
                        {CONCEPTS_META[attempt.concept]?.label || attempt.concept}
                      </td>
                      <td className="py-2.5 px-4 text-[#52525B] truncate max-w-[200px]" title={attempt.mutationType}>
                        {attempt.mutationType}
                      </td>
                      <td className="py-2.5 px-4 text-[#71717A]">
                        {attempt.hintsUsed === 0 ? 'Sin pistas' : `${attempt.hintsUsed} pista(s)`}
                      </td>
                      <td className="py-2.5 px-4">
                        {attempt.isCorrect ? (
                          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                            <span>Acierto</span>
                          </span>
                        ) : (
                          <span className="text-[#FF0033] font-semibold flex items-center space-x-1 text-red-elegant text-sm">
                            <span>Fallo</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#0A0A0A]">
                        {attempt.score} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-[#A1A1AA]">
              No hay intentos registrados con este filtro. ¡Practica en el Gimnasio para nutrir tu mapa!
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta fuera de pantalla usada solo para la exportación PNG */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}
      >
        <StatsExportCard
          ref={exportRef}
          streak={streak}
          stats={stats}
          totalAttempts={totalAttempts}
          globalAccuracy={globalAccuracy}
          primaryBlindSpot={primaryBlindSpot}
        />
      </div>
    </div>
  );
};
