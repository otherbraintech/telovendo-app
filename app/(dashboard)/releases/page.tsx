import { RELEASES } from "@/lib/versions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Wrench, Bug, Rocket } from "lucide-react";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Releases & Novedades - TeloVendo',
};

export default function ReleasesPage() {
  return (
    <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto py-8 px-6 space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Rocket className="size-8 text-blue-500" />
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">Releases & Novedades</h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium">Mantente al tanto de las últimas actualizaciones, mejoras de inteligencia artificial y nuevas funcionalidades del Core Engine de TeloVendo.</p>
      </div>

      <div className="space-y-12">
        {RELEASES.map((release, index) => {
          const isLatest = index === 0;
          return (
            <div key={release.version} className="relative pl-8 md:pl-0">
              {/* Desktop Timeline */}
              <div className="hidden md:block absolute left-[120px] top-0 bottom-[-48px] w-[1px] bg-border last:bottom-0"></div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 relative group">
                <div className="hidden md:flex flex-col items-end w-[100px] shrink-0 pt-2">
                  <span className="text-sm font-bold text-foreground">{release.version}</span>
                  <span className="text-xs text-muted-foreground font-medium">{new Date(release.date).toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>

                {/* Node */}
                <div className={`absolute left-0 top-3 md:left-[116px] size-[9px] rounded-full border-2 bg-background z-10 transition-colors ${isLatest ? 'border-blue-500 bg-blue-500 ring-4 ring-blue-500/20' : 'border-muted-foreground'}`}></div>

                <div className={`flex-1 space-y-4 p-6 rounded-2xl border transition-all ${isLatest ? 'bg-blue-500/5 shadow-2xl shadow-blue-500/5 border-blue-500/20' : 'bg-card border-border hover:border-border/80'}`}>
                  
                  <div className="md:hidden flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-foreground">{release.version}</span>
                    <span className="text-xs text-muted-foreground font-medium">{new Date(release.date).toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <h2 className={`text-xl font-black uppercase tracking-tight ${isLatest ? 'text-blue-400' : 'text-foreground'}`}>{release.title}</h2>
                      {release.type === 'major' ? (
                        <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 uppercase font-black text-[10px] tracking-widest"><Sparkles className="size-3 mr-1"/> Major</Badge>
                      ) : release.type === 'minor' ? (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase font-black text-[10px] tracking-widest"><Wrench className="size-3 mr-1" /> Feature</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-black text-[10px] tracking-widest"><Bug className="size-3 mr-1" /> Patch</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{release.description}</p>
                  </div>

                  <Separator className={isLatest ? 'bg-blue-500/10' : 'bg-border/50'} />

                  <ul className="space-y-3">
                    {release.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors">
                        <div className="mt-1.5 size-1.5 rounded-full bg-blue-500/40 shrink-0" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
