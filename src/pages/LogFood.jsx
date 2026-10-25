import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getTodayStr, roundMacro, sanitizeFoodItem } from '../store/useStore';
import { ArrowLeft, Sparkles, CheckCircle2, Mic, MicOff, Search, Trash2, Utensils } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { aiService } from '../services/aiService';
import SEOHead from '../components/SEOHead';

const DEFAULT_STAPLES = [
  { name: 'Double Scoop Whey Protein', calories: 260, protein: 50, carbs: 6, fat: 3 },
  { name: 'Chicken Breast & Jasmine Rice (200g)', calories: 480, protein: 54, carbs: 52, fat: 4 },
  { name: '4 Whole Eggs & Sourdough Toast', calories: 420, protein: 26, carbs: 32, fat: 20 },
  { name: 'Greek Yogurt (0%) & Wild Berries', calories: 210, protein: 24, carbs: 26, fat: 0 },
  { name: 'Oatmeal, Peanut Butter & Banana', calories: 510, protein: 18, carbs: 74, fat: 16 },
  { name: 'Lean Sirloin Steak & Sweet Potato', calories: 560, protein: 58, carbs: 42, fat: 14 },
  { name: 'Avocado Toast & Boiled Eggs', calories: 380, protein: 18, carbs: 30, fat: 22 },
  { name: 'Wild Salmon Fillet & Quinoa', calories: 520, protein: 46, carbs: 38, fat: 20 }
];

export default function LogFood() {
  const navigate = useNavigate();
  const addFoodLog = useStore(state => state.addFoodLog);
  const deleteFoodLog = useStore(state => state.deleteFoodLog);
  const foodLogs = useStore(state => state.foodLogs);
  const plan = useStore(state => state.plan);
  const targetCalories = plan?.macroTargets?.calories || 2500;
  const targetProtein = plan?.macroTargets?.protein || 160;
  const targetCarbs = plan?.macroTargets?.carbs || 280;
  const targetFat = plan?.macroTargets?.fat || 75;
  const getRecentFoods = useStore(state => state.getRecentFoods);
  
  const [recentFoods] = useState(() => getRecentFoods());

  // Merge recent foods with athletic staples so there are always rich quick suggestions
  const displayedStaples = useMemo(() => {
    const combined = [...recentFoods];
    for (const staple of DEFAULT_STAPLES) {
      if (!combined.some(item => item.name?.toLowerCase() === staple.name.toLowerCase())) {
        combined.push(staple);
      }
      if (combined.length >= 8) break;
    }
    return combined;
  }, [recentFoods]);
  
  const [query, setQuery] = useState('');
  const [food, setFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [servingQty, setServingQty] = useState(1);
  const [servingUnit, setServingUnit] = useState('serving');
  const [isCountable, setIsCountable] = useState(true);
  const [baseRef, setBaseRef] = useState(null);

  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [detectionSource, setDetectionSource] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copiedYesterday, setCopiedYesterday] = useState(false);

  // Yesterday's food logs for 1-tap staple duplication
  const yesterdayStr = getTodayStr(-1);
  const yesterdayFoods = useMemo(() => {
    return (foodLogs || []).filter(log => log.date === yesterdayStr).map(item => sanitizeFoodItem(item));
  }, [foodLogs, yesterdayStr]);

  // Sanitize numeric inputs to prevent leading zeros like '01.21'
  const sanitizeNumberInput = (val) => {
    if (val === '' || val === undefined || val === null) return '';
    const str = String(val);
    return str.replace(/^0+(?=\d)/, '');
  };

  // Live scaling when serving quantity / grams change
  const handleServingQtyChange = (newQty) => {
    const qty = Math.max(isCountable ? 0.5 : 10, Number(newQty) || (isCountable ? 1 : 50));
    setServingQty(qty);

    if (baseRef) {
      let multiplier = 1;
      if (isCountable) {
        multiplier = qty / (baseRef.baseQty || 1);
      } else {
        multiplier = qty / (baseRef.baseQty || 100);
      }
      const newP = roundMacro((baseRef.protein || 0) * multiplier);
      const newC = roundMacro((baseRef.carbs || 0) * multiplier);
      const newF = roundMacro((baseRef.fat || 0) * multiplier);
      const newCals = Math.round((newP * 4) + (newC * 4) + (newF * 9));

      setFood(prev => ({
        ...prev,
        protein: sanitizeNumberInput(newP),
        carbs: sanitizeNumberInput(newC),
        fat: sanitizeNumberInput(newF),
        calories: sanitizeNumberInput(newCals)
      }));
    }
  };

  // Automatically recalculate calories when user edits protein, carbs, or fat
  const handleMacroChange = (field, val) => {
    const sanitized = sanitizeNumberInput(val);
    const updated = { ...food, [field]: sanitized };
    const p = Number(field === 'protein' ? sanitized : food.protein) || 0;
    const c = Number(field === 'carbs' ? sanitized : food.carbs) || 0;
    const f = Number(field === 'fat' ? sanitized : food.fat) || 0;
    updated.calories = sanitizeNumberInput(Math.round((p * 4) + (c * 4) + (f * 9)));
    setFood(updated);
  };

  // Today's food logs and totals
  const todayStr = getTodayStr();
  const todayFoods = useMemo(() => {
    return (foodLogs || []).filter(log => log.date === todayStr);
  }, [foodLogs, todayStr]);

  const todayTotals = useMemo(() => {
    return todayFoods.reduce((acc, item) => {
      return {
        calories: roundMacro(acc.calories + (Number(item.calories) || 0)),
        protein: roundMacro(acc.protein + (Number(item.protein) || 0)),
        carbs: roundMacro(acc.carbs + (Number(item.carbs) || 0)),
        fat: roundMacro(acc.fat + (Number(item.fat) || 0))
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayFoods]);

  const analyzeFood = async (customQuery) => {
    const textToSearch = (customQuery !== undefined ? customQuery : query) || '';
    if (!textToSearch.trim()) return;

    setIsAnalyzing(true);
    setSearchError('');
    setSearchResults([]);
    
    try {
      const resolved = await aiService.resolveFood(textToSearch);

      if (resolved && resolved.length > 0) {
        if (resolved.length === 1) {
          const item = resolved[0];
          const countable = item.baseRef?.isCountable !== undefined ? item.baseRef.isCountable : (item.unit !== 'g');
          const initQty = item.quantity || (countable ? 1 : 100);
          const initUnit = item.unit || (countable ? (item.baseRef?.defaultUnit || 'serving') : 'g');

          setIsCountable(countable);
          setServingQty(initQty);
          setServingUnit(initUnit);
          setBaseRef(item.baseRef || {
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            baseQty: initQty,
            isCountable: countable,
            defaultUnit: initUnit
          });

          setFood({
            name: item.name,
            calories: sanitizeNumberInput(roundMacro(item.calories)),
            protein: sanitizeNumberInput(roundMacro(item.protein || 0)),
            carbs: sanitizeNumberInput(roundMacro(item.carbs || 0)),
            fat: sanitizeNumberInput(roundMacro(item.fat || 0))
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
    const countable = item.baseRef?.isCountable !== undefined ? item.baseRef.isCountable : (item.unit !== 'g');
    const initQty = item.quantity || (countable ? 1 : 100);
    const initUnit = item.unit || (countable ? (item.baseRef?.defaultUnit || 'serving') : 'g');

    setIsCountable(countable);
    setServingQty(initQty);
    setServingUnit(initUnit);
    setBaseRef(item.baseRef || {
      calories: item.calories || item.caloriesPer100g,
      protein: item.protein || item.proteinPer100g || 0,
      carbs: item.carbs || item.carbsPer100g || 0,
      fat: item.fat || item.fatPer100g || 0,
      baseQty: initQty,
      isCountable: countable,
      defaultUnit: initUnit
    });

    setFood({
      name: item.name,
      calories: sanitizeNumberInput(roundMacro(item.calories || item.caloriesPer100g)),
      protein: sanitizeNumberInput(roundMacro(item.protein || item.proteinPer100g || 0)),
      carbs: sanitizeNumberInput(roundMacro(item.carbs || item.carbsPer100g || 0)),
      fat: sanitizeNumberInput(roundMacro(item.fat || item.fatPer100g || 0))
    });
    setDetectionSource(item.source || 'usda');
    setShowForm(true);
  };

  const handleQuickAdd = (f) => {
    setIsCountable(true);
    setServingQty(1);
    setServingUnit('serving');
    setBaseRef({
      calories: f.calories,
      protein: f.protein || 0,
      carbs: f.carbs || 0,
      fat: f.fat || 0,
      baseQty: 1,
      isCountable: true,
      defaultUnit: 'serving'
    });
    setFood({
      name: f.name,
      calories: sanitizeNumberInput(roundMacro(f.calories)),
      protein: sanitizeNumberInput(roundMacro(f.protein || 0)),
      carbs: sanitizeNumberInput(roundMacro(f.carbs || 0)),
      fat: sanitizeNumberInput(roundMacro(f.fat || 0))
    });
    setDetectionSource('recent');
    setShowForm(true);
  };

  const handleInstantLog = (itemToLog) => {
    const target = itemToLog || food;
    if (!target.name || !target.calories) return;
    addFoodLog({
      name: target.name.trim(),
      calories: roundMacro(target.calories),
      protein: roundMacro(target.protein || 0),
      carbs: roundMacro(target.carbs || 0),
      fat: roundMacro(target.fat || 0),
      source: target.source || detectionSource || 'instant'
    });
    setSuccessData({ ...target });
    setShowSuccess(true);
    setShowForm(false);
    setQuery('');
    setSearchResults([]);
    setFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
  };

  const handleCopyYesterdayFoods = () => {
    if (yesterdayFoods.length === 0 || copiedYesterday) return;

    // Check existing meals logged today to prevent duplicate cloning
    const existingNames = new Set(todayFoods.map(f => (f.name || '').trim().toLowerCase()));
    let clonedCount = 0;
    let addedCalories = 0;

    for (const rawItem of yesterdayFoods) {
      const item = sanitizeFoodItem(rawItem);
      const nameKey = item.name.toLowerCase();
      if (existingNames.has(nameKey)) continue;

      existingNames.add(nameKey);
      clonedCount++;
      addedCalories += item.calories;

      addFoodLog({
        name: item.name,
        calories: roundMacro(item.calories),
        protein: roundMacro(item.protein),
        carbs: roundMacro(item.carbs),
        fat: roundMacro(item.fat),
        source: 'copy-yesterday'
      });
    }

    setCopiedYesterday(true);

    if (clonedCount > 0) {
      setSuccessData({
        name: `${clonedCount} Staple Foods Cloned`,
        calories: roundMacro(addedCalories)
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3500);
    }
  };

  const handleSave = () => {
    if (!food.name || !food.calories) return;
    addFoodLog({
      name: food.name.trim(),
      calories: roundMacro(food.calories),
      protein: roundMacro(food.protein),
      carbs: roundMacro(food.carbs),
      fat: roundMacro(food.fat),
      source: detectionSource || 'manual'
    });
    setSuccessData({ ...food });
    setShowSuccess(true);
    setShowForm(false);
    setQuery('');
    setSearchResults([]);
    setFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
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
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                navigate('/dashboard');
              }
            }} 
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
          <div className="logfood-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.95fr)',
            gap: '24px',
            alignItems: 'start',
            width: '100%'
          }}>
            <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
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
                        background: '#10B981',
                        color: '#0D0D0D',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', marginTop: '14px' }}>
                    <Sparkles size={16} />
                    <span>Analyzing natural language input & resolving macros...</span>
                  </div>
                )}

                {searchError && (
                  <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '14px' }}>
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
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                          {item.protein || 0}g P · {item.carbs || 0}g C · {item.fat || 0}g F
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981', whiteSpace: 'nowrap' }}>
                          {item.calories} kcal
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInstantLog(item);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            background: '#10B981',
                            color: '#0D0D0D',
                            fontSize: '11px',
                            fontWeight: '800',
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + LOG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Today's Logged Foods Section */}
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
                {/* Header with Totals */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Utensils size={16} color="#10B981" />
                      <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                        Today's Fuel Log
                      </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '3px' }}>
                      {todayFoods.length} {todayFoods.length === 1 ? 'entry' : 'entries'} logged today
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#10B981' }}>
                      {todayTotals.calories} <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500' }}>/ {targetCalories} kcal</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((todayTotals.calories / (targetCalories || 2500)) * 100))}%`,
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Macro breakdown pills */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
                  gap: '8px',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>Protein</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                      {todayTotals.protein}g <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '500' }}>/ {targetProtein}g</span>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>Carbs</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                      {todayTotals.carbs}g <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '500' }}>/ {targetCarbs}g</span>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>Fat</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                      {todayTotals.fat}g <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '500' }}>/ {targetFat}g</span>
                    </div>
                  </div>
                </div>

                {/* List of Today's Foods */}
                {todayFoods.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500' }}>
                      No meals logged yet today.
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666', marginTop: '4px' }}>
                      Use the search bar above, speak into mic, or tap a quick staple to log instantly.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {todayFoods.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s ease',
                          minWidth: 0,
                          maxWidth: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                              display: 'block'
                            }}>
                              {log.name}
                            </span>
                            {log.source && (
                              <span style={{
                                fontSize: '9px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: log.source === 'ai' ? 'rgba(0, 208, 156, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                color: log.source === 'ai' ? '#00D09C' : '#8E8E93',
                                flexShrink: 0
                              }}>
                                {log.source}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '2px' }}>
                            {roundMacro(log.protein)}g P · {roundMacro(log.carbs)}g C · {roundMacro(log.fat)}g F
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#00D09C', whiteSpace: 'nowrap' }}>
                            +{roundMacro(log.calories)} kcal
                          </span>
                          <button
                            onClick={() => deleteFoodLog(log.id)}
                            title="Delete meal entry"
                            aria-label={`Delete ${log.name}`}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#666666',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#FF7243'}
                            onMouseLeave={e => e.currentTarget.style.color = '#666666'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
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
                    marginBottom: '24px',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Copy Yesterday's Meal Staples
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                      {yesterdayFoods.length} logged items ({yesterdayFoods.reduce((a, b) => a + (Number(b.calories) || 0), 0)} kcal)
                    </div>
                  </div>

                  <button
                    onClick={handleCopyYesterdayFoods}
                    disabled={copiedYesterday}
                    style={{
                      background: copiedYesterday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 114, 67, 0.15)',
                      border: copiedYesterday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 114, 67, 0.4)',
                      color: copiedYesterday ? '#10B981' : '#FF7243',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: copiedYesterday ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedYesterday ? 'Copied ✓' : 'COPY ALL'}
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
                    Quick Meals & Athletic Staples
                  </span>
                  <span style={{ fontSize: '11px', color: '#00D09C', fontWeight: '600' }}>Instant Fill</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {displayedStaples.map((f, i) => (
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

              {/* Interactive Quantity / Serving Control */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {isCountable ? `Serving Quantity (${servingUnit || 'units'})` : `Portion Weight (${servingUnit || 'g'})`}
                  </label>
                  <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                    Auto-calculates macros & calories
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Stepper [-] */}
                  <button
                    type="button"
                    onClick={() => {
                      const step = isCountable ? 1 : 25;
                      const min = isCountable ? 1 : 25;
                      handleServingQtyChange(Math.max(min, Number(servingQty) - step));
                    }}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    -
                  </button>

                  {/* Current Qty Display / Input */}
                  <div style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 12px',
                    height: '42px'
                  }}>
                    <input
                      type="number"
                      min={isCountable ? 1 : 10}
                      step={isCountable ? 1 : 10}
                      value={servingQty}
                      onChange={e => handleServingQtyChange(sanitizeNumberInput(e.target.value))}
                      style={{
                        width: '70px',
                        background: 'transparent',
                        border: 'none',
                        color: '#10B981',
                        fontSize: '20px',
                        fontWeight: '800',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#8E8E93', marginLeft: '4px' }}>
                      {isCountable ? (servingUnit && servingUnit !== 'whole' ? servingUnit : 'qty') : 'g'}
                    </span>
                  </div>

                  {/* Stepper [+] */}
                  <button
                    type="button"
                    onClick={() => {
                      const step = isCountable ? 1 : 25;
                      handleServingQtyChange(Number(servingQty) + step);
                    }}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Quick Preset Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {(isCountable ? [1, 2, 3, 4, 6] : [50, 100, 150, 200, 250, 300]).map((preset) => {
                    const isSelected = Number(servingQty) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleServingQtyChange(preset)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          background: isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isSelected ? '#0D0D0D' : '#F3F4F6',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {preset}{!isCountable ? 'g' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={food.calories}
                  onChange={e => setFood({ ...food, calories: sanitizeNumberInput(e.target.value) })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    color: '#10B981',
                    fontSize: '24px',
                    fontWeight: '800',
                    marginTop: '6px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', textTransform: 'uppercase' }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={food.protein}
                    onChange={e => handleMacroChange('protein', e.target.value)}
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
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#F3F4F6', textTransform: 'uppercase' }}>
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={food.carbs}
                    onChange={e => handleMacroChange('carbs', e.target.value)}
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
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={food.fat}
                    onChange={e => handleMacroChange('fat', e.target.value)}
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: '1 1 80px',
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
                  onClick={() => handleInstantLog()}
                  style={{
                    flex: '1 1 120px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10B981',
                    padding: '14px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={15} />
                  INSTANT LOG
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    flex: '2 1 140px',
                    background: '#10B981',
                    color: '#0D0D0D',
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
