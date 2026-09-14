import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getTodayStr } from '../store/useStore';
import { ArrowLeft, Sparkles, CheckCircle2, Mic, MicOff, Search } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { aiService } from '../services/aiService';
import SEOHead from '../components/SEOHead';

export default function LogFood() {
  const navigate = useNavigate();
  const addFoodLog = useStore(state => state.addFoodLog);
  const foodLogs = useStore(state => state.foodLogs);
  const getRecentFoods = useStore(state => state.getRecentFoods);
  
  const [recentFoods] = useState(() => getRecentFoods());
  
  const [query, setQuery] = useState('');
  const [food, setFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [detectionSource, setDetectionSource] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Yesterday's food logs for 1-tap staple duplication
  const yesterdayStr = getTodayStr(-1);
  const yesterdayFoods = foodLogs.filter(log => log.date === yesterdayStr);

  const analyzeFood = async (customQuery) => {
    const textToSearch = (customQuery !== undefined ? customQuery : query) || '';
    if (!textToSearch.trim()) return;

    setIsAnalyzing(true);
    setSearchError('');
    setSearchResults([]);
    
    try {
      const resolved = await aiService.resolveFood(textToSearch);

      if (resolved && resolved.length > 0) {
        if (resolved.length === 1 && (resolved[0].source === 'local' || resolved[0].source === 'ai')) {
          const item = resolved[0];
          setFood({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          });
          setDetectionSource(item.source);
          setShowForm(true);
          return;
        }

        setSearchResults(resolved);
        setDetectionSource(resolved[0].source || 'usda');
      } else {
        setSearchError('No matches found. You can enter values manually.');
      }
    } catch (err) {
      setSearchError(err.message || 'Error resolving food.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startVoiceDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSearchError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSearchError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        analyzeFood(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setSearchError('Voice dictation error: ' + (event.error || 'unknown'));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      setSearchError('Voice initialization failed: ' + e.message);
    }
  };

  const handleSelectResult = (item) => {
    setFood({
      name: item.name,
      calories: item.calories || item.caloriesPer100g,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0
    });
    setDetectionSource(item.source || 'usda');
    setShowForm(true);
  };

  const handleQuickAdd = (f) => {
    setFood({
      name: f.name,
      calories: f.calories,
      protein: f.protein || 0,
      carbs: f.carbs || 0,
      fat: f.fat || 0
    });
    setDetectionSource('recent');
    setShowForm(true);
  };

  const handleCopyYesterdayFoods = () => {
    if (yesterdayFoods.length === 0) return;
    for (const item of yesterdayFoods) {
      addFoodLog({
        name: item.name,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        source: 'copy-yesterday'
      });
    }
    setSuccessData({ name: `${yesterdayFoods.length} Staple Foods Cloned`, calories: yesterdayFoods.reduce((a, b) => a + (Number(b.calories) || 0), 0) });
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleSave = () => {
    if (!food.name || !food.calories) return;
    addFoodLog({
      name: food.name,
      calories: Number(food.calories) || 0,
      protein: Number(food.protein) || 0,
      carbs: Number(food.carbs) || 0,
      fat: Number(food.fat) || 0,
      source: detectionSource || 'manual'
    });
    setSuccessData({ ...food });
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 1200);
  };

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '120px', width: '100%' }}>
      {/* Top Navbar */}
      <TopNavbar />

      {/* Success Banner */}
      {showSuccess && (
        <div style={{
          background: 'rgba(0, 208, 156, 0.15)',
          border: '1px solid #00D09C',
          borderRadius: '18px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#FFFFFF',
          marginBottom: '24px'
        }}>
          <CheckCircle2 size={22} color="#00D09C" />
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>Logged: {successData?.name}</div>
            <div style={{ fontSize: '12px', color: '#00D09C' }}>+{successData?.calories} kcal added to daily balance</div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="focus-container" style={{ padding: '0 8px' }}>
        <SEOHead
          title="Log Nutrition & Macros | Anchor"
          description="Rapid sub-15s macro logging with speech recognition, USDA food database search, and intelligent AI parser."
        />
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              NUTRITION LOGGING
            </span>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-1px', marginTop: '4px' }}>
              {showForm ? 'Confirm Macro Entry' : 'Log Meal or Food'}
            </h1>
          </div>

          <button 
            onClick={() => navigate('/')} 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.06)', 
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {!showForm ? (
          <div className="split-panel-2col">
            <div>
              {/* Search Box Card */}
              <div 
                className="glass-card"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-backdrop)',
                  WebkitBackdropFilter: 'var(--glass-backdrop)',
                  borderRadius: '24px',
                  padding: '28px',
                  border: 'var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                  marginBottom: '24px'
                }}
              >
                <form onSubmit={e => { e.preventDefault(); analyzeFood(); }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Describe meal (e.g. 200g chicken breast, 1 avocado)..."
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '16px 85px 16px 20px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />

                    {/* Mic Button */}
                    <button
                      type="button"
                      onClick={startVoiceDictation}
                      title="Hands-free Voice Dictation"
                      className={isListening ? "pulse-mic" : ""}
                      style={{
                        position: 'absolute',
                        right: '48px',
                        background: isListening ? '#FF7243' : 'rgba(255, 255, 255, 0.06)',
                        color: isListening ? '#FFFFFF' : '#8E8E93',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    {/* Submit Search Button */}
                    <button
                      type="submit"
                      disabled={isAnalyzing}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: '#FF7243',
                        color: '#FFFFFF',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Search size={15} />
                    </button>
                  </div>
                </form>

                {isAnalyzing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00D09C', fontSize: '13px', marginTop: '14px' }}>
                    <Sparkles size={16} />
                    <span>Analyzing natural language input & resolving macros...</span>
                  </div>
                )}

                {searchError && (
                  <div style={{ color: '#FF7243', fontSize: '13px', marginTop: '14px' }}>
                    {searchError}
                  </div>
                )}
              </div>

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Database Results ({searchResults.length})
                  </span>
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectResult(item)}
                      className="glass-card"
                      style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'var(--glass-backdrop)',
                        WebkitBackdropFilter: 'var(--glass-backdrop)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        border: 'var(--glass-border)',
                        boxShadow: 'var(--glass-shadow)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                          {item.protein || 0}g P · {item.carbs || 0}g C · {item.fat || 0}g F
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#00D09C' }}>
                        {item.calories} kcal
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              {/* Copy Yesterday's Foods Shortcut */}
              {yesterdayFoods.length > 0 && (
                <div 
                  className="glass-card"
                  style={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-backdrop)',
                    WebkitBackdropFilter: 'var(--glass-backdrop)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: 'var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                      Copy Yesterday's Meal Staples
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                      {yesterdayFoods.length} logged items ({yesterdayFoods.reduce((a, b) => a + (Number(b.calories) || 0), 0)} kcal)
                    </div>
                  </div>

                  <button
                    onClick={handleCopyYesterdayFoods}
                    style={{
                      background: 'rgba(255, 114, 67, 0.15)',
                      border: '1px solid rgba(255, 114, 67, 0.4)',
                      color: '#FF7243',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    COPY ALL
                  </button>
                </div>
              )}

              {/* Quick Staples: Either Recent Foods or Default Athletic Staples */}
              <div
                className="glass-card"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-backdrop)',
                  WebkitBackdropFilter: 'var(--glass-backdrop)',
                  borderRadius: '24px',
                  padding: '24px',
                  border: 'var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {recentFoods.length > 0 ? 'Recent Meals & Staples' : 'Athletic Fuel Presets (1-Tap)'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#00D09C', fontWeight: '600' }}>Instant Fill</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(recentFoods.length > 0 ? recentFoods : [
                    { name: 'Double Scoop Whey Protein', calories: 260, protein: 50, carbs: 6, fat: 3 },
                    { name: 'Chicken Breast & Jasmine Rice (200g)', calories: 480, protein: 54, carbs: 52, fat: 4 },
                    { name: '4 Whole Eggs & Sourdough Toast', calories: 420, protein: 26, carbs: 32, fat: 20 },
                    { name: 'Greek Yogurt (0%) & Wild Berries', calories: 210, protein: 24, carbs: 26, fat: 0 },
                    { name: 'Oatmeal, Peanut Butter & Banana', calories: 510, protein: 18, carbs: 74, fat: 16 },
                    { name: 'Lean Sirloin Steak & Sweet Potato', calories: 560, protein: 58, carbs: 42, fat: 14 }
                  ]).map((f, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAdd(f)}
                      className="glass-pill"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{f.name}</span>
                      <span style={{ color: '#FF7243', fontWeight: '700' }}>{f.calories} kcal</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nutrition Intelligence & Guidelines Card */}
              <div
                className="glass-card"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-backdrop)',
                  WebkitBackdropFilter: 'var(--glass-backdrop)',
                  borderRadius: '24px',
                  padding: '24px',
                  border: 'var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Sparkles size={18} color="#00D09C" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Voice & Natural Speech Engine</span>
                </div>
                <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  Tap the microphone button to dictate naturally. Anchor calculates protein, carbs, fat, and calories in real time without manual hunting or barcode hurdles.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(0, 208, 156, 0.1)', color: '#00D09C', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
                    100% Offline Capable
                  </span>
                  <span style={{ background: 'rgba(255, 114, 67, 0.1)', color: '#FF7243', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
                    USDA Database Verified
                  </span>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px' }}>
                    Sub-15s Quick Entry
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Confirm Form */
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '32px',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                  Food Item
                </label>
                <input
                  type="text"
                  value={food.name}
                  onChange={e => setFood({ ...food, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: '700',
                    marginTop: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={food.calories}
                  onChange={e => setFood({ ...food, calories: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    color: '#00D09C',
                    fontSize: '24px',
                    fontWeight: '800',
                    marginTop: '6px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#B2E040', textTransform: 'uppercase' }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={food.protein}
                    onChange={e => setFood({ ...food, protein: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: '700',
                      marginTop: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#F4C767', textTransform: 'uppercase' }}>
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={food.carbs}
                    onChange={e => setFood({ ...food, carbs: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: '700',
                      marginTop: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#FF7243', textTransform: 'uppercase' }}>
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={food.fat}
                    onChange={e => setFood({ ...food, fat: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: '700',
                      marginTop: '6px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    flex: 2,
                    background: '#FF7243',
                    color: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  CONFIRM & LOG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
