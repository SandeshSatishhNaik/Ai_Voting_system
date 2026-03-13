import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { 
  Send, Cpu, CheckCircle2, AlertCircle, Trophy, Activity, 
  BarChart3, FileText, ChevronRight, RefreshCw, Sparkles, 
  Users, Eye, Zap, Shield, Microscope, Target, Compass
} from 'lucide-react';

const AGENT_META = {
  "A": { name: "First-Principles", icon: Microscope, color: "#3b82f6", description: "Deconstructs into fundamental truths" },
  "B": { name: "Devil's Advocate", icon: Shield, color: "#ef4444", description: "Refutes common misconceptions" },
  "C": { name: "Step-by-Step", icon: Target, color: "#8b5cf6", description: "3-5 discrete logical steps" },
  "D": { name: "Executive Summary", icon: Compass, color: "#f59e0b", description: "High density, bullet points" },
  "E": { name: "Lateral Thinker", icon: Zap, color: "#10b981", description: "Edge cases & boundary conditions" }
};

const INITIAL_AGENTS = Object.keys(AGENT_META).reduce((acc, id) => ({
  ...acc,
  [id]: { status: 'idle', score: null, reviews: {} }
}), {});

// Advanced D3 Chord Diagram Component
function ConsensusChord({ matrix, agents }) {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!matrix || Object.keys(matrix).length === 0) return;

    const width = 400;
    const height = 400;
    const outerRadius = Math.min(width, height) * 0.5 - 40;
    const innerRadius = outerRadius - 20;

    const ids = Object.keys(AGENT_META);
    const data = ids.map(tId => 
      ids.map(rId => (matrix[tId]?.[rId]?.accuracy_score || 0))
    );

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)(data);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    const color = d3.scaleOrdinal()
      .domain(ids)
      .range(ids.map(id => AGENT_META[id].color));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    g.append("g")
      .selectAll("path")
      .data(chord.groups)
      .join("path")
        .attr("fill", d => color(ids[d.index]))
        .attr("d", arc);

    g.append("g")
      .attr("fill-opacity", 0.6)
      .selectAll("path")
      .data(chord)
      .join("path")
        .attr("d", ribbon)
        .attr("fill", d => color(ids[d.source.index]))
        .attr("stroke", d => d3.rgb(color(ids[d.source.index])).darker());

  }, [matrix]);

  return <svg ref={svgRef} className="mx-auto" />;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [finalData, setFinalData] = useState(null);
  const [activeReview, setActiveReview] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setAgents(INITIAL_AGENTS);
    setFinalData(null);

    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.status === 'final') {
                setFinalData(data);
                setIsProcessing(false);
                setActiveReview(null);
              } else if (data.type === 'status_update') {
                setAgents(prev => ({
                  ...prev,
                  [data.agent_id]: { ...prev[data.agent_id], status: data.status, error: data.error }
                }));
              } else if (data.type === 'peer_review_status') {
                setActiveReview(data);
                setAgents(prev => ({
                  ...prev,
                  [data.target]: {
                    ...prev[data.target],
                    reviews: {
                      ...prev[data.target].reviews,
                      [data.reviewer]: { status: data.status, score: data.score, reasoning: data.reasoning }
                    }
                  }
                }));
              }
            } catch (err) {
              console.error("Parse error", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Fetch error", err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 p-4 md:p-8 font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Ultra Neural Background */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <main className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-6 pt-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center space-x-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Voter Ultra Engine v2.0</span>
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            PEER <span className="text-primary italic">CONSENSUS</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            Decentralized multi-agent analytical system featuring 25-point cross-audit loops and high-fidelity reasoning.
          </p>
        </header>

        <section className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
          <form onSubmit={handleSubmit} className="relative glass p-2 rounded-2xl flex items-center shadow-2xl transition-all">
            <div className="p-4"><Cpu className="w-6 h-6 text-slate-500" /></div>
            <input 
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Inject analytical proposition..."
              className="bg-transparent border-none focus:ring-0 flex-1 px-2 py-4 text-xl font-medium placeholder:text-slate-700"
              disabled={isProcessing}
            />
            <button 
              disabled={isProcessing || !query.trim()}
              className={`px-10 py-4 rounded-xl font-black flex items-center space-x-3 transition-all ${isProcessing ? 'bg-slate-800 text-slate-600' : 'bg-white text-black hover:bg-primary hover:text-white'}`}
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              <span className="tracking-tighter">{isProcessing ? "BUILDING CONSENSUS" : "INITIATE AUDIT"}</span>
            </button>
          </form>
          {activeReview && activeReview.status === 'reviewing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -bottom-8 left-0 right-0 text-center text-[10px] font-black text-secondary uppercase tracking-[0.3em]">
              Auditing: Agent {activeReview.reviewer} → Agent {activeReview.target}
            </motion.div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Display Grid */}
          <div className="lg:col-span-8 space-y-8">
            {/* Voting Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="glass rounded-3xl p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden border-white/5">
                <div className="absolute top-6 left-8 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Consensus Flow</h2>
                </div>
                {finalData ? (
                  <ConsensusChord matrix={finalData.voting_matrix} agents={agents} />
                ) : (
                  <div className="text-center space-y-4 opacity-20 grayscale">
                    <RefreshCw className="w-12 h-12 mx-auto animate-spin-slow" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Waiting for Matrix Data</p>
                  </div>
                )}
              </section>

              <section className="glass rounded-3xl p-8 border-white/5">
                <div className="flex items-center space-x-2 mb-8">
                  <BarChart3 className="w-4 h-4 text-secondary" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Peer Scores</h2>
                </div>
                <div className="space-y-6">
                  {Object.keys(AGENT_META).map(id => {
                    const score = finalData?.scoreboard[id] || 0;
                    return (
                      <div key={id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AGENT_META[id].color }} />
                            <span className="text-[10px] font-bold text-slate-400">AGENT {id}</span>
                          </div>
                          <span className="text-sm font-mono font-black text-white">{score > 0 ? score.toFixed(2) : "---"}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(score / 25) * 100}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: AGENT_META[id].color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Winning Analysis */}
            <AnimatePresence>
              {finalData && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-10 border-primary/20 border-2 relative">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Trophy className="w-48 h-48 text-primary" />
                  </div>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-primary/20 rounded-2xl">
                        <Trophy className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gold Consensus</h2>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Selected via peer majority • Agent {finalData.execution_log.winner_idx}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-10 relative z-10">
                    {/* Scratchpad parsing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center">
                          <Microscope className="w-3 h-3 mr-2" /> Initial Reasoning
                        </div>
                        <div className="text-sm font-mono text-slate-400 bg-white/[0.02] p-6 rounded-2xl border border-white/5 leading-relaxed">
                          {finalData.best_response.match(/<scratchpad>([\s\S]*?)<\/scratchpad>/)?.[1].trim().slice(0, 300) || "Deep analysis performed."}...
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center">
                          <Shield className="w-3 h-3 mr-2" /> Self-Critique Loop
                        </div>
                        <div className="text-sm font-mono text-slate-400 bg-white/[0.02] p-6 rounded-2xl border border-white/5 leading-relaxed italic">
                          {finalData.best_response.match(/<critique>([\s\S]*?)<\/critique>/)?.[1].trim() || "Agent identified no critical logical failures."}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-2" /> Final Refined Output
                      </div>
                      <div className="text-2xl leading-relaxed text-white font-medium selection:bg-accent/30">
                        {finalData.best_response.match(/<final_answer>([\s\S]*?)<\/final_answer>/)?.[1].trim() || finalData.best_response.replace(/<scratchpad>[\s\S]*?<\/scratchpad>/, '').trim()}
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Telemetry */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-3xl p-8 space-y-8 sticky top-8">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Live Telemetry</div>
                <div className="text-5xl font-black text-white italic">
                  {((finalData?.execution_log?.eval_success_rate || 0) * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Audit Integrity</div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-8">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Agent States</div>
                <div className="space-y-4">
                  {Object.entries(AGENT_META).map(([id, meta]) => {
                    const s = agents[id]?.status;
                    const Icon = meta.icon;
                    return (
                      <motion.div 
                        whileHover={{ x: 4 }}
                        key={id} 
                        className={`p-4 rounded-2xl border transition-all ${s === 'completed' ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${meta.color}20` }}>
                              <Icon className="w-4 h-4" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <div className="text-xs font-black text-white uppercase tracking-tighter">{meta.name}</div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s}</div>
                            </div>
                          </div>
                          {s === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                          ) : s !== 'idle' ? (
                            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <div className="w-1 h-1 bg-slate-800 rounded-full" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
