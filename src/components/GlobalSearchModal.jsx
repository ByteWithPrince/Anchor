import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  LayoutDashboard, 
  BarChart3, 
  Dumbbell, 
  Apple, 
  Calendar, 
  Compass, 
  Navigation2, 
  Crown, 
  Sparkles, 
  Plus, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';

// Levenshtein distance algorithm for intelligent typo tolerance
function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Compute string similarity ratio (0 to 1)
function stringSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

const SEARCH_DATABASE = [
  {
    id: 'dashboard',
    title: 'Dashboard Cockpit',
    subtitle: 'Unified daily view: workout goals, calories, heart telemetry & health score',
    path: '/dashboard',
    category: 'Pages',
    keywords: ['dashboard', 'home', 'overview', 'calorie balance', 'daily', 'cockpit', 'main', 'dashbord'],
    icon: LayoutDashboard,
    badgeColor: '#00D09C'
  },
  {
    id: 'statistics',
    title: 'Statistics & Progress',
    subtitle: 'Volume progression curves, 1RM calculators, and consistency heatmap',
    path: '/progress',
    category: 'Pages',
    keywords: ['statistics', 'stats', 'progress', 'charts', 'trends', 'analytics', 'history', 'volume', '1rm', 'sstatistcs', 'statstics'],
    icon: BarChart3,
    badgeColor: '#FF7243'
  },
  {
    id: 'workouts',
    title: 'Workouts & Ready to Train',
    subtitle: 'Split rotation order, active preview, and session launcher',
    path: '/workout-overview',
    category: 'Pages',
    keywords: ['workouts', 'workout', 'training', 'ready to train', 'session', 'split rotation', 'routine', 'launcher', 'wrkout'],
    icon: Dumbbell,
    badgeColor: '#00D09C'
  },
  {
    id: 'nutrition',
    title: 'Nutrition & Log Food',
    subtitle: 'Natural language speech macro parser, USDA database, and staple cloning',
    path: '/log-food',
    category: 'Pages',
    keywords: ['nutrition', 'food', 'diet', 'macros', 'calories', 'protein', 'carbs', 'fat', 'log meal', 'speech', 'voice', 'nutriton'],
    icon: Apple,
    badgeColor: '#FF7243'
  },
  {
    id: 'schedule',
    title: 'Schedule & Split Builder',
    subtitle: 'Curate PPL, Upper/Lower, Arnold split, and 7-day weekly targets',
    path: '/plan',
    category: 'Pages',
    keywords: ['schedule', 'plan', 'split builder', 'push pull legs', 'ppl', 'upper lower', 'weekly plan', 'macros targets', 'scheduel'],
    icon: Calendar,
    badgeColor: '#B2E040'
  },
  {
    id: 'product',
    title: 'Product Architecture & Showcase',
    subtitle: 'Public interactive sandbox, local-first design, and benchmarks',
    path: '/landing',
    category: 'Pages',
    keywords: ['product', 'landing', 'showcase', 'architecture', 'benchmarks', 'about', 'local first'],
    icon: Compass,
    badgeColor: '#818CF8'
  },
  {
    id: 'log-workout',
    title: 'Log Active Workout',
    subtitle: 'Record sets, reps, weight, RPE, and web audio rest countdown chimes',
    path: '/log-workout',
    category: 'Actions',
    keywords: ['log workout', 'record sets', 'reps', 'weight', 'rpe', 'rest timer', 'exercise'],
    icon: Plus,
    badgeColor: '#00D09C'
  },
  {
    id: 'gps-cardio',
    title: 'GPS Cardio & Distance Telemetry',
    subtitle: 'HTML5 hardware geolocation tracking with spherical Haversine math',
    path: '/dashboard',
    category: 'Features',
    keywords: ['gps', 'cardio', 'run', 'walk', 'distance', 'outdoor', 'pace', 'telemetry', 'map', 'breadcrumb'],
    icon: Navigation2,
    badgeColor: '#FF7243'
  },
  {
    id: 'athlete-profile',
    title: 'Switch Athlete Profile',
    subtitle: 'Manage local multi-lifter profiles or cloud authentication sync',
    path: '/dashboard',
    category: 'Features',
    keywords: ['profile', 'athlete', 'user', 'switch account', 'cloud sync', 'login', 'register'],
    icon: Crown,
    badgeColor: '#F4C767'
  },
  {
    id: 'overload-math',
    title: 'Progressive Overload & Epley 1RM',
    subtitle: 'Estimate 1-rep maximum based on submaximal resistance efforts',
    path: '/progress',
    category: 'Tools',
    keywords: ['epley', '1rm', 'one rep max', 'overload', 'progressive overload', 'calculator'],
    icon: TrendingUp,
    badgeColor: '#00D09C'
  }
];

export default function GlobalSearchModal({ isOpen, onClose, onOpenProfile, onOpenGps }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global Keyboard Shortcuts (Cmd/Ctrl + K, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Intelligent Search & Fuzzy Matching Logic
  const { results, isFallbackSuggestion, didYouMeanList } = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    // If query is empty, display top navigation destinations
    if (!cleanQuery) {
      return {
        results: SEARCH_DATABASE.slice(0, 6),
        isFallbackSuggestion: false,
        didYouMeanList: []
      };
    }

    const directMatches = [];
    const fuzzyMatches = [];
    const similarities = [];

    SEARCH_DATABASE.forEach(item => {
      const itemTitle = item.title.toLowerCase();
      const itemSub = item.subtitle.toLowerCase();
      const allWords = [itemTitle, ...item.keywords];

      // 1. Exact or prefix match
      if (itemTitle.includes(cleanQuery) || item.keywords.some(k => k === cleanQuery)) {
        directMatches.push({ ...item, matchType: 'exact', score: 1.0 });
        return;
      }

      // 2. Substring in keywords or subtitle
      if (item.keywords.some(k => k.includes(cleanQuery)) || itemSub.includes(cleanQuery)) {
        directMatches.push({ ...item, matchType: 'substring', score: 0.85 });
        return;
      }

      // 3. Typo / Levenshtein fuzzy match across keywords and title
      let bestSimilarity = 0;
      for (const word of allWords) {
        // Direct Levenshtein check
        const dist = levenshteinDistance(cleanQuery, word);
        // Allow up to 2 character edits or high similarity ratio
        if (dist <= 2 || (cleanQuery.length > 3 && dist <= 3)) {
          const sim = stringSimilarity(cleanQuery, word);
          if (sim > bestSimilarity) bestSimilarity = sim;
        }
      }

      if (bestSimilarity >= 0.55) {
        fuzzyMatches.push({ ...item, matchType: 'fuzzy', score: bestSimilarity });
      } else {
        // Track similarity for "Did you mean?" fallback
        let maxSim = 0;
        for (const word of allWords) {
          const sim = stringSimilarity(cleanQuery, word);
          if (sim > maxSim) maxSim = sim;
        }
        similarities.push({ item, sim: maxSim });
      }
    });

    // Combine direct and fuzzy matches
    const allFound = [...directMatches, ...fuzzyMatches].sort((a, b) => b.score - a.score);

    if (allFound.length > 0) {
      return {
        results: allFound,
        isFallbackSuggestion: false,
        didYouMeanList: []
      };
    }

    // 4. No matches found -> "Did you mean?" intelligent suggestions
    similarities.sort((a, b) => b.sim - a.sim);
    const topSuggestions = similarities.slice(0, 3).map(s => s.item);

    return {
      results: topSuggestions,
      isFallbackSuggestion: true,
      didYouMeanList: topSuggestions.map(s => s.title)
    };
  }, [query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle arrow key and enter key navigation
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleSelect = (item) => {
    onClose();
    if (item.id === 'gps-cardio' && onOpenGps) {
      onOpenGps();
    } else if (item.id === 'athlete-profile' && onOpenProfile) {
      onOpenProfile();
    } else {
      navigate(item.path);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      onClick={onClose}
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 24px 16px'
      }}
    >
      {/* Modal Dialog Card */}
      <div 
        onClick={e => e.stopPropagation()}
        className="modal-bottom-sheet glass-modal animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: '26px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.85), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '14px 18px',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          <Search size={20} color="#FF7243" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pages, workouts, telemetry, macros... (e.g. statistics, dashboard)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: '500',
              outline: 'none',
              padding: 0
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C0C0C0',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close Search"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#8E8E93',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ESC
          </button>
        </div>

        {/* Intelligent "Did you mean?" Notification */}
        {isFallbackSuggestion && (
          <div style={{
            background: 'rgba(255, 114, 67, 0.12)',
            border: '1px solid rgba(255, 114, 67, 0.3)',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FFFFFF'
          }}>
            <HelpCircle size={18} color="#FF7243" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px' }}>
              No direct matches for <strong style={{ color: '#FF7243' }}>"{query}"</strong>. Showing intelligent similar suggestions below:
            </div>
          </div>
        )}

        {/* Results List */}
        <div 
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px'
          }}
        >
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
              <Search size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>No results found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Try searching for "dashboard", "statistics", or "nutrition".</div>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComponent = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="glass-card-subtle"
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%), rgba(25, 32, 45, 0.85)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected 
                      ? '1px solid rgba(255, 255, 255, 0.28)' 
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(0, 0, 0, 0.4)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(0, 208, 156, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${isSelected ? 'rgba(0, 208, 156, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#00D09C' : '#FFFFFF',
                      transition: 'all 0.2s ease'
                    }}>
                      <IconComponent size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                          {item.title}
                        </span>
                        {item.matchType === 'fuzzy' && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: '#FF7243',
                            background: 'rgba(255, 114, 67, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>
                            Fuzzy Match
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: item.badgeColor || '#8E8E93',
                          background: 'rgba(255, 255, 255, 0.06)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          textTransform: 'uppercase'
                        }}>
                          {item.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '3px' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: isSelected ? '#00D09C' : '#666666',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {isSelected && <span>Jump</span>}
                    <ArrowRight size={15} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hotkeys Navigation Guide */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '12px',
          fontSize: '11px',
          color: '#8E8E93'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span><kbd style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF' }}>↑</kbd> <kbd style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF' }}>↓</kbd> navigate</span>
            <span><kbd style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF' }}>↵</kbd> select</span>
            <span><kbd style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: '#FFFFFF' }}>esc</kbd> close</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00D09C' }}>
            <Sparkles size={12} />
            <span>Anchor Instant Palette</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
