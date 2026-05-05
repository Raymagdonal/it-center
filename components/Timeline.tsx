import React from 'react';
import { MeetingAgenda, AgendaItem } from '../types';
import { Clock, Users, Calendar, UserCircle, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface TimelineProps {
  agenda: MeetingAgenda;
}

export const Timeline: React.FC<TimelineProps> = ({ agenda }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-4 border-b border-cyan-500/20 pb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-display hover-glow cursor-default uppercase">
          {agenda.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-slate-400 font-mono text-xs">
          <div className="flex items-center gap-2 border border-slate-800 px-3 py-1 rounded bg-black/40">
            <Calendar className="h-3.5 w-3.5 text-cyan-500" />
            <span>{agenda.date || "ยังไม่ระบุวันที่"}</span>
          </div>
          <div className="flex items-center gap-2 border border-slate-800 px-3 py-1 rounded bg-black/40">
            <Users className="h-3.5 w-3.5 text-cyan-500" />
            <span>{agenda.stakeholders.length} Participants</span>
          </div>
        </div>
        <p className="text-slate-400 leading-relaxed max-w-2xl font-sans italic border-l-2 border-cyan-900 pl-4 py-1">
          {agenda.summary}
        </p>
        
        {/* Stakeholders Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {agenda.stakeholders.map((stakeholder, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/30 text-cyan-400 border border-cyan-500/20">
              {stakeholder}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-cyan-900 before:to-transparent">
        {agenda.items.map((item, index) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ item: AgendaItem }> = ({ item }) => {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      {/* Icon/Dot on the timeline */}
      <div className="absolute left-0 w-10 h-10 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center md:left-1/2 md:-translate-x-1/2 shadow-[0_0_15px_rgba(0,0,0,1)] z-10 group-hover:border-cyan-400 transition-all group-hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]">
        <Clock className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
      </div>

      {/* Content Card */}
      <Card className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2.5rem)] ml-14 md:ml-0 transition-all hover:shadow-cyan-900/10`}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 border-b border-slate-800/50 pb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-400 border border-cyan-500/20">
              {item.time} ({item.duration})
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 group-hover:text-cyan-300">
              <UserCircle className="h-3.5 w-3.5" />
              {item.owner}
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-display tracking-wide uppercase group-hover:text-cyan-400 transition-colors">
            {item.topic}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed font-sans whitespace-pre-wrap">
            {item.description}
          </p>

          {/* Media Assets in Timeline */}
          {item.media && item.media.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
               {item.media.map(m => (
                 <div key={m.id} className="relative rounded overflow-hidden border border-slate-800 aspect-video bg-black group/media">
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity" />
                    ) : (
                      <video src={m.url} className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity bg-black/40">
                       {m.type === 'image' ? <ImageIcon className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6 text-white" />}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};