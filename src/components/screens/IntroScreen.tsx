import { useGameStore } from '../../store/gameStore'
import { TypewriterText } from '../ui/TypewriterText'

const CLASS_INTROS: Record<string, { lines: string[]; objective: string; tone: 'bad' | 'neutral' | 'good' }> = {
  // ── MAUVAISES ────────────────────────────────────────────────────────────
  Vagabond: {
    tone: 'bad',
    lines: [
      "Tu es un Vagabond. Félicitations — c'est le terme poli.",
      "500 crédits. 3 unités de carburant. Aucune compétence particulière.",
      "Le secteur a vu des milliers de gens comme toi passer par là.",
      "La plupart ne sont pas restés longtemps.",
      "Mais toi tu vas sûrement t'en sortir. Non. Probablement pas.",
      "Essaie quand même.",
    ],
    objective: "Objectif : survivre assez longtemps pour avoir une histoire à raconter.",
  },
  Ferrailleur: {
    tone: 'bad',
    lines: [
      "Ton vaisseau tient avec de la colle, du fil de fer, et ton optimisme démesuré.",
      "30% de chance que tu perdes ta cargaison à chaque voyage.",
      "Tu as quand même décidé de faire du commerce dans l'espace.",
      "C'est courageux. C'est aussi profondément irrationnel.",
      "On aimerait te souhaiter bonne chance.",
      "On va quand même le faire.",
    ],
    objective: "Objectif : générer assez de profit pour compenser tes pertes en transit.",
  },
  Endetté: {
    tone: 'bad',
    lines: [
      "Tu dois de l'argent à quelqu'un. Beaucoup d'argent.",
      "50 crédits par jour. Chaque jour. Sans exception.",
      "Tu ne sais pas vraiment à qui. C'est le genre de dette que tu préfères ne pas tracer.",
      "La bonne nouvelle : tu as 1 200 crédits pour commencer.",
      "La mauvaise nouvelle : t'as compris.",
      "Cours.",
    ],
    objective: "Objectif : générer plus vite que tu ne perds. Ce n'est pas une métaphore.",
  },
  Accro: {
    tone: 'bad',
    lines: [
      "Chaque voyage te coûte 100 crédits de plus que les autres.",
      "On ne te demande pas pourquoi. C'est pas nos affaires.",
      "Ce qu'on sait : tu as une stamina hors norme et des reflexes imprévisibles.",
      "Et des besoins. Réguliers. Coûteux.",
      "Ça peut fonctionner. Si les crédits rentrent assez vite.",
      "Ça peut aussi très mal finir. La marge est fine.",
    ],
    objective: "Objectif : maintenir le flux de crédits pour financer la route — et le reste.",
  },
  Maudit: {
    tone: 'bad',
    lines: [
      "L'univers ne t'aime pas.",
      "Ce n'est pas une façon de parler — c'est une réalité mécanique de ton existence.",
      "Une bonne chose sur deux va se retourner contre toi.",
      "Les autres pilotes ont de la chance ou de la compétence.",
      "Toi tu as... de la persévérance ? On suppose.",
      "Bonne chance. Non, sérieusement cette fois.",
    ],
    objective: "Objectif : trouver un chemin qui n'implique pas trop de bonnes choses.",
  },

  // ── ÉQUILIBRÉES ────────────────────────────────────────────────────────────
  Marchand: {
    tone: 'neutral',
    lines: [
      "Le secteur fonctionne sur une règle simple : acheter bas, vendre haut.",
      "Les guerres de factions font fluctuer les prix. Les événements mondiaux aussi.",
      "Tu commences à Port Méridien — un nœud commercial stable.",
      "Explore le marché local. Cherche du travail. Identifie les routes rentables.",
      "Les premières runs servent à comprendre les flux. Après, tu optimises.",
    ],
    objective: "Objectif : atteindre 10 000 crédits. Ensuite viser 100 000. Ensuite les étoiles.",
  },
  Mécanicien: {
    tone: 'neutral',
    lines: [
      "Tu connais les moteurs mieux que tu te connais toi-même.",
      "Ton vaisseau a une capacité carburant supérieure — ça ouvre des routes inaccessibles aux autres.",
      "Commence par explorer. Comprendre la géographie du secteur est ton avantage.",
      "Les stations distantes paient mieux. Les zones profondes récompensent l'endurance.",
      "Ton vaisseau est ton outil. Entretiens-le.",
    ],
    objective: "Objectif : cartographier le secteur et en tirer profit. Tu es fait pour l'exploration longue distance.",
  },
  Explorateur: {
    tone: 'neutral',
    lines: [
      "L'espace n'a plus de secrets pour toi — ou presque.",
      "Les zones neutres te récompensent mieux qu'aux autres. Explore souvent.",
      "Chaque station a une histoire. Certaines ont des fragments de quelque chose de plus grand.",
      "Des arcs narratifs se déclenchent selon ce que tu fais et où tu vas.",
      "Suis les fils. Le secteur a une mémoire.",
    ],
    objective: "Objectif : voir ce que le secteur cache à ceux qui n'osent pas regarder.",
  },
  Médecin: {
    tone: 'neutral',
    lines: [
      "Tu soignes dans des cliniques qui n'existent pas officiellement.",
      "Les médicaments te rapportent 50% de plus qu'aux autres — c'est ton commerce.",
      "Tu peux aussi te soigner plus efficacement en combat.",
      "Commence par Port Méridien. Constitue un stock. Trouve des routes à forte demande médicale.",
      "Les zones en conflit paient le mieux. C'est une réalité inconfortable.",
    ],
    objective: "Objectif : construire un réseau de distribution dans un secteur qui en a besoin.",
  },

  // ── BONNES ────────────────────────────────────────────────────────────────
  Contrebandier: {
    tone: 'good',
    lines: [
      "Tu achètes 20% moins cher que tout le monde. C'est un avantage considérable.",
      "En échange : les pirates te connaissent. Ils se montrent deux fois plus souvent.",
      "Tu commences aux Bas-Fonds de Vega — là où les bonnes affaires et les mauvaises rencontres coexistent.",
      "Fais attention à ta route. Certains corridors sont plus surveillés que d'autres.",
      "Et si tu te fais attraper, tu sais déjà quoi faire.",
    ],
    objective: "Objectif : exploiter ton avantage prix avant que tes ennemis t'exploitent.",
  },
  Vétéran: {
    tone: 'good',
    lines: [
      "Trente ans de guerres. Tu as survécu à des choses qui ont tué des gens meilleurs que toi.",
      "Tu frappes plus fort. Tu encaisses moins. Tu commences avec de l'élan.",
      "La Citadelle Écarlate est ta base — un endroit qui te ressemble.",
      "Les quêtes de combat te rapportent plus. Les bosses de stations sont ta spécialité.",
      "Le secteur a besoin de gens comme toi. Ou il a peur d'eux. C'est la même chose.",
    ],
    objective: "Objectif : nettoyer le secteur, faction par faction, boss par boss.",
  },
  Héritier: {
    tone: 'good',
    lines: [
      "Tu ne sais pas te battre. Tu n'en as pas besoin.",
      "300 crédits arrivent tous les 5 jours, automatiquement. Ton héritage travaille pour toi.",
      "En revanche : tu ne peux pas acheter d'armes. Ce n'est pas dans ton éducation.",
      "Commence à La Citadelle Écarlate. Construis ton réseau commercial.",
      "L'argent ouvre des portes que la force ne peut pas forcer.",
    ],
    objective: "Objectif : devenir le pilier économique du secteur sans jamais toucher une arme.",
  },
  Hackeur: {
    tone: 'good',
    lines: [
      "Tu vois les prix des stations avant d'arriver. C'est une information que les autres paient cher.",
      "En combat tu peux pirater l'équipement ennemi. Les systèmes n'ont pas de secrets pour toi.",
      "Physiquement, tu es vulnérable. Compense par la préparation.",
      "Commence à La Citadelle Écarlate. Identifie les flux d'information du secteur.",
      "Tout est connecté. Tu es le seul à pouvoir lire les connexions.",
    ],
    objective: "Objectif : exploiter l'information comme d'autres exploitent la force brute.",
  },
  'Seigneur de guerre': {
    tone: 'good',
    lines: [
      "Les pirates t'évitent. Ce n'est pas de la chance — c'est ta réputation.",
      "Tu attaques 50% plus fort. Tu commences avec de l'élan en combat.",
      "Les stations paisibles ne veulent pas de toi. C'est leur problème.",
      "Tu commences à Fort Kharos — un endroit qui comprend ce que tu es.",
      "Le secteur a des cibles. Certaines ont des primes. Va les chercher.",
    ],
    objective: "Objectif : imposer ta domination sur le secteur, un boss à la fois.",
  },
}

const TONE_COLOR: Record<string, string> = {
  bad: 'var(--red)',
  neutral: 'var(--cyan)',
  good: 'var(--gold)',
}

export function IntroScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  const intro = CLASS_INTROS[gs.class.name] ?? {
    tone: 'neutral',
    lines: ["Le secteur t'attend.", "Commence par explorer la station et chercher du travail."],
    objective: "Objectif : survivre et prospérer.",
  }

  const accentColor = TONE_COLOR[intro.tone]

  return (
    <div className="layout" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="t-xs t-dim t-center" style={{ letterSpacing: '3px' }}>— BRIEFING —</div>

      <div className="px-box" style={{ borderColor: accentColor, background: 'rgba(0,0,0,0.5)' }}>
        <div className="row" style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>{gs.class.icon}</span>
          <div>
            <div className="t-sm t-bright">{gs.class.name}</div>
            <div className="t-xs" style={{ color: accentColor }}>{gs.class.tier === 'bad' ? '⚠ Classe difficile' : gs.class.tier === 'good' ? '★ Classe avancée' : '◆ Classe équilibrée'}</div>
          </div>
        </div>

        <div className="col" style={{ gap: '10px', marginBottom: '20px' }}>
          {intro.lines.map((line, i) => (
            <div key={i} className="t-xs" style={{ lineHeight: '2', color: i === intro.lines.length - 1 ? 'var(--text-bright)' : 'var(--text)' }}>
              <TypewriterText text={line} speed={10} />
            </div>
          ))}
        </div>

        <div className="px-box" style={{ borderColor: accentColor, background: 'rgba(0,0,0,0.3)', marginBottom: '0' }}>
          <div className="t-xs" style={{ color: accentColor, lineHeight: '2' }}>
            {intro.objective}
          </div>
        </div>
      </div>

      <div className="px-box" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          Station de départ : <span className="t-bright">{gs.currentStation}</span>
          {' · '}Crédits : <span className="t-gold">{gs.credits.toLocaleString()} cr</span>
          {' · '}Carburant : <span className="t-cyan">{gs.fuel}/{gs.maxFuel}</span>
        </div>
      </div>

      <div className="px-box" style={{ borderColor: 'var(--purple)', background: 'rgba(80,0,120,0.15)' }}>
        <div className="t-xs mb6" style={{ color: 'var(--purple)', letterSpacing: '2px' }}>★★ MISSION PRINCIPALE</div>
        <div className="t-xs t-bright mb6">Rallier les 4 Fragments Nexus</div>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          Des fragments d'une technologie inconnue sont dispersés dans le secteur. Certaines stations les gardent. Certains PNJs savent où ils sont. Retrouver les 4 fragments — c'est l'objectif ultime d'une run.
        </div>
        <div className="t-xs mt6" style={{ color: 'var(--purple)' }}>Fragments collectés ce run : {gs.stationPiecesRallied} / 4</div>
      </div>

      <button className="px-btn px-btn--primary" onClick={() => goTo('station-hub')}>
        Commencer la run →
      </button>
    </div>
  )
}
